import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createProductDto: CreateProductDto, creatorId: string) {
    const { images, factoryId, factoryPrice, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        factoryId: factoryId ? BigInt(factoryId) : null,
        factoryPrice: factoryPrice ? factoryPrice : null,
        creatorId: BigInt(creatorId),
        images: {
          create: images.map((img, index) => ({
            imageUrl: img.imageUrl,
            imageType: img.imageType,
            sortOrder: img.sortOrder ?? index,
          })),
        },
      },
      include: {
        images: true,
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        factory: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return this.formatProductResponse(product);
  }

  async findAll(queryDto: QueryProductDto) {
    const { name, productCode, crowdfundingStatus, creatorId, factoryId, startDate, endDate, page = 1, pageSize = 10 } = queryDto;

    const where: any = {};

    if (name) {
      where.name = { contains: name };
    }

    if (productCode) {
      where.productCode = { contains: productCode };
    }

    if (crowdfundingStatus) {
      where.crowdfundingStatus = crowdfundingStatus;
    }

    if (creatorId) {
      where.creatorId = BigInt(creatorId);
    }

    if (factoryId) {
      where.factoryId = BigInt(factoryId);
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          creator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          factory: {
            select: {
              id: true,
              username: true,
            },
          },
          crowdfunding: {
            select: {
              id: true,
              status: true,
              currentAmount: true,
              targetAmount: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((product) => this.formatProductResponse(product)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        factory: {
          select: {
            id: true,
            username: true,
          },
        },
        crowdfunding: {
          include: {
            investments: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    return this.formatProductResponse(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: { creator: true },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 检查编辑权限：创建人或管理链上级
    await this.checkEditPermission(product.creatorId.toString(), userId);

    const { images, factoryId, factoryPrice, ...updateData } = updateProductDto;

    // 如果有图片更新，先删除旧图片再创建新图片
    if (images) {
      await this.prisma.productImage.deleteMany({
        where: { productId: BigInt(id) },
      });
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: BigInt(id) },
      data: {
        ...updateData,
        ...(factoryId !== undefined && { factoryId: factoryId ? BigInt(factoryId) : null }),
        ...(factoryPrice !== undefined && { factoryPrice }),
        ...(images && {
          images: {
            create: images.map((img, index) => ({
              imageUrl: img.imageUrl,
              imageType: img.imageType,
              sortOrder: img.sortOrder ?? index,
            })),
          },
        }),
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        factory: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return this.formatProductResponse(updatedProduct);
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: { crowdfunding: true },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 检查编辑权限
    await this.checkEditPermission(product.creatorId.toString(), userId);

    // 如果有进行中的众筹，不能删除
    if (product.crowdfunding && product.crowdfunding.status === 'in_progress') {
      throw new BadRequestException('产品有进行中的众筹，无法删除');
    }

    await this.prisma.product.delete({
      where: { id: BigInt(id) },
    });

    return { message: '删除成功' };
  }

  // 检查用户是否有编辑产品的权限
  private async checkEditPermission(creatorId: string, userId: string) {
    if (creatorId === userId) {
      return; // 创建者本人
    }

    // 获取创建者的管理链
    const managementChain = await this.usersService.getManagementChain(creatorId);

    if (!managementChain.includes(userId)) {
      throw new ForbiddenException('无权编辑此产品');
    }
  }

  // 格式化产品响应
  private formatProductResponse(product: any) {
    const result: any = {
      id: product.id.toString(),
      name: product.name,
      productCode: product.productCode,
      description: product.description,
      designConcept: product.designConcept,
      sellingPoints: product.sellingPoints,
      specifications: product.specifications,
      crowdfundingStatus: product.crowdfundingStatus,
      creatorId: product.creatorId.toString(),
      factoryId: product.factoryId?.toString() || null,
      factoryPrice: product.factoryPrice ? Number(product.factoryPrice) : null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    if (product.creator) {
      result.creator = {
        id: product.creator.id.toString(),
        username: product.creator.username,
        role: product.creator.role,
      };
    }

    if (product.factory) {
      result.factory = {
        id: product.factory.id.toString(),
        username: product.factory.username,
      };
    }

    if (product.images) {
      result.images = product.images.map((img: any) => ({
        id: img.id.toString(),
        productId: img.productId.toString(),
        imageUrl: img.imageUrl,
        imageType: img.imageType,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
      }));
    }

    if (product.crowdfunding) {
      result.crowdfunding = {
        id: product.crowdfunding.id.toString(),
        status: product.crowdfunding.status,
        currentAmount: Number(product.crowdfunding.currentAmount),
        targetAmount: Number(product.crowdfunding.targetAmount),
      };

      // 如果有 productId 字段（来自 findOne 查询）
      if (product.crowdfunding.productId) {
        result.crowdfunding.productId = product.crowdfunding.productId.toString();
      }

      // 如果有 investments 字段（来自 findOne 查询）
      if (product.crowdfunding.investments) {
        result.crowdfunding.investments = product.crowdfunding.investments.map((inv: any) => ({
          id: inv.id.toString(),
          crowdfundingId: inv.crowdfundingId.toString(),
          userId: inv.userId.toString(),
          amount: Number(inv.amount),
          investmentType: inv.investmentType,
          periodId: inv.periodId.toString(),
          createdAt: inv.createdAt,
          user: inv.user ? {
            id: inv.user.id.toString(),
            username: inv.user.username,
            role: inv.user.role,
          } : undefined,
        }));
      }
    } else {
      result.crowdfunding = null;
    }

    return result;
  }
}
