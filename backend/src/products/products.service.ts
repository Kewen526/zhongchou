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
    const { name, productCode, crowdfundingStatus, creatorId, page = 1, pageSize = 10 } = queryDto;

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
    return {
      ...product,
      id: product.id.toString(),
      creatorId: product.creatorId.toString(),
      factoryId: product.factoryId?.toString() || null,
      factoryPrice: product.factoryPrice ? Number(product.factoryPrice) : null,
      creator: product.creator
        ? {
            ...product.creator,
            id: product.creator.id.toString(),
          }
        : undefined,
      factory: product.factory
        ? {
            ...product.factory,
            id: product.factory.id.toString(),
          }
        : undefined,
      images: product.images?.map((img: any) => ({
        ...img,
        id: img.id.toString(),
        productId: img.productId.toString(),
      })),
      crowdfunding: product.crowdfunding
        ? {
            ...product.crowdfunding,
            id: product.crowdfunding.id.toString(),
            productId: product.crowdfunding.productId.toString(),
            currentAmount: Number(product.crowdfunding.currentAmount),
            targetAmount: Number(product.crowdfunding.targetAmount),
          }
        : null,
    };
  }
}
