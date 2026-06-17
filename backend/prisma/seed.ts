import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedBrand = {
  name: string;
  slug: string;
};

type SeedCategory = {
  name: string;
  slug: string;
};

type SeedSourcePlatform = {
  name: string;
  slug: string;
  baseUrl: string;
};

type SeedProduct = {
  id: string;
  slug: string;
  title: string;
  brandSlug: string;
  categorySlug: string;
  sourcePlatformSlug: string;
  price: string;
  color: string;
  description: string;
  availableColors: string[];
  tags: string[];
  isActive: boolean;
};

const brands = [
  { name: "Aurelia Studio", slug: "aurelia-studio" },
  { name: "Luma Wardrobe", slug: "luma-wardrobe" },
  { name: "Nova Lane", slug: "nova-lane" },
  { name: "Mira Atelier", slug: "mira-atelier" },
  { name: "Kairo Collective", slug: "kairo-collective" },
  { name: "Solenne", slug: "solenne" },
  { name: "Estelle & Co", slug: "estelle-and-co" }
] satisfies SeedBrand[];

const categories = [
  { name: "Tops", slug: "tops" },
  { name: "Bottoms", slug: "bottoms" },
  { name: "Dresses", slug: "dresses" },
  { name: "Outerwear", slug: "outerwear" },
  { name: "Shoes", slug: "shoes" },
  { name: "Bags", slug: "bags" },
  { name: "Accessories", slug: "accessories" }
] satisfies SeedCategory[];

const sourcePlatforms = [
  {
    name: "Velora Demo Retail",
    slug: "velora-demo-retail",
    baseUrl: "https://example.com/velora-demo-retail"
  },
  {
    name: "Sample Style Market",
    slug: "sample-style-market",
    baseUrl: "https://example.com/sample-style-market"
  },
  {
    name: "Mock Boutique",
    slug: "mock-boutique",
    baseUrl: "https://example.com/mock-boutique"
  }
] satisfies SeedSourcePlatform[];

const products = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "ribbed-square-neck-tank",
    title: "Ribbed Square Neck Tank",
    brandSlug: "aurelia-studio",
    categorySlug: "tops",
    sourcePlatformSlug: "velora-demo-retail",
    price: "32.00",
    color: "White",
    description: "A fitted ribbed tank designed as a clean layering piece.",
    availableColors: ["White", "Black", "Sage"],
    tags: ["minimal", "layering", "summer"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "satin-wrap-blouse",
    title: "Satin Wrap Blouse",
    brandSlug: "mira-atelier",
    categorySlug: "tops",
    sourcePlatformSlug: "sample-style-market",
    price: "58.00",
    color: "Champagne",
    description: "A soft satin blouse with a wrap front and relaxed sleeves.",
    availableColors: ["Champagne", "Black", "Rose"],
    tags: ["evening", "office", "satin"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    slug: "cropped-knit-cardigan",
    title: "Cropped Knit Cardigan",
    brandSlug: "luma-wardrobe",
    categorySlug: "tops",
    sourcePlatformSlug: "mock-boutique",
    price: "64.00",
    color: "Sage",
    description: "A cropped cardigan with a soft hand feel and button front.",
    availableColors: ["Sage", "Cream", "Charcoal"],
    tags: ["knitwear", "casual", "layering"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    slug: "high-rise-straight-jeans",
    title: "High Rise Straight Jeans",
    brandSlug: "nova-lane",
    categorySlug: "bottoms",
    sourcePlatformSlug: "velora-demo-retail",
    price: "82.00",
    color: "Blue",
    description: "Classic straight-leg denim with a high rise and easy fit.",
    availableColors: ["Blue", "Light Blue", "Black"],
    tags: ["denim", "casual", "everyday"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    slug: "tailored-wide-leg-trousers",
    title: "Tailored Wide Leg Trousers",
    brandSlug: "kairo-collective",
    categorySlug: "bottoms",
    sourcePlatformSlug: "sample-style-market",
    price: "96.00",
    color: "Black",
    description: "Structured wide-leg trousers with a clean front finish.",
    availableColors: ["Black", "Taupe", "Navy"],
    tags: ["tailored", "office", "wide-leg"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    slug: "pleated-midi-skirt",
    title: "Pleated Midi Skirt",
    brandSlug: "solenne",
    categorySlug: "bottoms",
    sourcePlatformSlug: "mock-boutique",
    price: "72.00",
    color: "Ivory",
    description: "A flowing midi skirt with fine pleats and a comfortable waistband.",
    availableColors: ["Ivory", "Black", "Olive"],
    tags: ["midi", "pleated", "feminine"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    slug: "linen-button-front-midi-dress",
    title: "Linen Button Front Midi Dress",
    brandSlug: "aurelia-studio",
    categorySlug: "dresses",
    sourcePlatformSlug: "sample-style-market",
    price: "118.00",
    color: "Sand",
    description: "A breathable linen-blend midi dress with front buttons.",
    availableColors: ["Sand", "White", "Terracotta"],
    tags: ["linen", "midi", "vacation"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    slug: "soft-slip-dress",
    title: "Soft Slip Dress",
    brandSlug: "mira-atelier",
    categorySlug: "dresses",
    sourcePlatformSlug: "mock-boutique",
    price: "88.00",
    color: "Black",
    description: "A bias-cut slip dress with adjustable straps and fluid drape.",
    availableColors: ["Black", "Champagne", "Navy"],
    tags: ["evening", "minimal", "slip"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    slug: "floral-puff-sleeve-mini-dress",
    title: "Floral Puff Sleeve Mini Dress",
    brandSlug: "estelle-and-co",
    categorySlug: "dresses",
    sourcePlatformSlug: "velora-demo-retail",
    price: "76.00",
    color: "Rose",
    description: "A floral mini dress with puff sleeves and a softly fitted waist.",
    availableColors: ["Rose", "Blue", "Cream"],
    tags: ["floral", "mini", "weekend"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    slug: "lightweight-trench-coat",
    title: "Lightweight Trench Coat",
    brandSlug: "kairo-collective",
    categorySlug: "outerwear",
    sourcePlatformSlug: "mock-boutique",
    price: "148.00",
    color: "Beige",
    description: "A lightweight trench coat with a relaxed belt and storm flap.",
    availableColors: ["Beige", "Olive", "Black"],
    tags: ["trench", "outerwear", "transitional"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    slug: "faux-leather-moto-jacket",
    title: "Faux Leather Moto Jacket",
    brandSlug: "nova-lane",
    categorySlug: "outerwear",
    sourcePlatformSlug: "sample-style-market",
    price: "132.00",
    color: "Black",
    description: "A moto-inspired faux leather jacket with polished hardware.",
    availableColors: ["Black", "Brown"],
    tags: ["jacket", "moto", "faux-leather"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    slug: "quilted-cropped-jacket",
    title: "Quilted Cropped Jacket",
    brandSlug: "luma-wardrobe",
    categorySlug: "outerwear",
    sourcePlatformSlug: "velora-demo-retail",
    price: "110.00",
    color: "Olive",
    description: "A cropped quilted jacket with snap closures and light padding.",
    availableColors: ["Olive", "Cream", "Black"],
    tags: ["quilted", "cropped", "casual"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000013",
    slug: "minimal-leather-sneakers",
    title: "Minimal Leather Sneakers",
    brandSlug: "kairo-collective",
    categorySlug: "shoes",
    sourcePlatformSlug: "velora-demo-retail",
    price: "95.00",
    color: "White",
    description: "Clean low-top sneakers with a smooth leather upper.",
    availableColors: ["White", "Black", "Taupe"],
    tags: ["sneakers", "minimal", "everyday"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000014",
    slug: "block-heel-ankle-boots",
    title: "Block Heel Ankle Boots",
    brandSlug: "solenne",
    categorySlug: "shoes",
    sourcePlatformSlug: "sample-style-market",
    price: "128.00",
    color: "Brown",
    description: "Ankle boots with a steady block heel and side zip.",
    availableColors: ["Brown", "Black", "Cream"],
    tags: ["boots", "block-heel", "fall"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000015",
    slug: "strappy-low-heel-sandals",
    title: "Strappy Low Heel Sandals",
    brandSlug: "estelle-and-co",
    categorySlug: "shoes",
    sourcePlatformSlug: "mock-boutique",
    price: "74.00",
    color: "Nude",
    description: "Low-heel sandals with delicate straps and a square toe.",
    availableColors: ["Nude", "Black", "Gold"],
    tags: ["sandals", "heel", "occasion"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000016",
    slug: "structured-mini-tote",
    title: "Structured Mini Tote",
    brandSlug: "mira-atelier",
    categorySlug: "bags",
    sourcePlatformSlug: "mock-boutique",
    price: "98.00",
    color: "Tan",
    description: "A compact structured tote with top handles and a crossbody strap.",
    availableColors: ["Tan", "Black", "Cream"],
    tags: ["tote", "structured", "crossbody"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000017",
    slug: "crescent-shoulder-bag",
    title: "Crescent Shoulder Bag",
    brandSlug: "nova-lane",
    categorySlug: "bags",
    sourcePlatformSlug: "velora-demo-retail",
    price: "86.00",
    color: "Black",
    description: "A curved shoulder bag with a smooth finish and zip closure.",
    availableColors: ["Black", "Ivory", "Burgundy"],
    tags: ["shoulder-bag", "minimal", "day-to-night"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000018",
    slug: "woven-crossbody-bag",
    title: "Woven Crossbody Bag",
    brandSlug: "aurelia-studio",
    categorySlug: "bags",
    sourcePlatformSlug: "sample-style-market",
    price: "68.00",
    color: "Natural",
    description: "A woven crossbody bag with a soft strap and magnetic closure.",
    availableColors: ["Natural", "Black", "Tan"],
    tags: ["woven", "crossbody", "summer"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000019",
    slug: "gold-hoop-earrings",
    title: "Gold Hoop Earrings",
    brandSlug: "estelle-and-co",
    categorySlug: "accessories",
    sourcePlatformSlug: "sample-style-market",
    price: "28.00",
    color: "Gold",
    description: "Polished medium hoop earrings for everyday styling.",
    availableColors: ["Gold", "Silver"],
    tags: ["jewelry", "earrings", "everyday"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000020",
    slug: "silk-print-scarf",
    title: "Silk Print Scarf",
    brandSlug: "solenne",
    categorySlug: "accessories",
    sourcePlatformSlug: "mock-boutique",
    price: "44.00",
    color: "Navy",
    description: "A lightweight printed scarf that can be styled at the neck or bag handle.",
    availableColors: ["Navy", "Ivory", "Rose"],
    tags: ["scarf", "printed", "accessory"],
    isActive: true
  },
  {
    id: "10000000-0000-4000-8000-000000000021",
    slug: "slim-leather-belt",
    title: "Slim Leather Belt",
    brandSlug: "luma-wardrobe",
    categorySlug: "accessories",
    sourcePlatformSlug: "velora-demo-retail",
    price: "42.00",
    color: "Espresso",
    description: "A slim leather belt with a simple metal buckle.",
    availableColors: ["Espresso", "Black", "Tan"],
    tags: ["belt", "leather", "classic"],
    isActive: true
  }
] satisfies SeedProduct[];

function placeholderImageUrl(product: SeedProduct): string {
  return `https://placehold.co/800x1000/png?text=${encodeURIComponent(product.title)}`;
}

function demoProductUrl(product: SeedProduct): string {
  return `https://example.com/velora-products/${product.slug}`;
}

function getRequiredId(records: Map<string, string>, slug: string, label: string): string {
  const id = records.get(slug);

  if (id === undefined) {
    throw new Error(`Missing seeded ${label} record for slug: ${slug}`);
  }

  return id;
}

async function upsertBrands(): Promise<Map<string, string>> {
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name },
      create: brand
    });
  }

  const records = await prisma.brand.findMany({
    where: {
      slug: {
        in: brands.map((brand) => brand.slug)
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  return new Map(records.map((record) => [record.slug, record.id]));
}

async function upsertCategories(): Promise<Map<string, string>> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
  }

  const records = await prisma.category.findMany({
    where: {
      slug: {
        in: categories.map((category) => category.slug)
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  return new Map(records.map((record) => [record.slug, record.id]));
}

async function upsertSourcePlatforms(): Promise<Map<string, string>> {
  for (const sourcePlatform of sourcePlatforms) {
    await prisma.sourcePlatform.upsert({
      where: { slug: sourcePlatform.slug },
      update: {
        name: sourcePlatform.name,
        baseUrl: sourcePlatform.baseUrl
      },
      create: sourcePlatform
    });
  }

  const records = await prisma.sourcePlatform.findMany({
    where: {
      slug: {
        in: sourcePlatforms.map((sourcePlatform) => sourcePlatform.slug)
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  return new Map(records.map((record) => [record.slug, record.id]));
}

async function upsertProducts(
  brandIds: Map<string, string>,
  categoryIds: Map<string, string>,
  sourcePlatformIds: Map<string, string>
): Promise<void> {
  for (const product of products) {
    const brandId = getRequiredId(brandIds, product.brandSlug, "brand");
    const categoryId = getRequiredId(categoryIds, product.categorySlug, "category");
    const sourcePlatformId = getRequiredId(
      sourcePlatformIds,
      product.sourcePlatformSlug,
      "source platform"
    );
    const productData = {
      title: product.title,
      brandId,
      categoryId,
      sourcePlatformId,
      price: new Prisma.Decimal(product.price),
      imageUrl: placeholderImageUrl(product),
      productUrl: demoProductUrl(product),
      color: product.color,
      description: product.description,
      availableColors: product.availableColors,
      tags: product.tags,
      isActive: product.isActive
    };

    await prisma.product.upsert({
      where: { id: product.id },
      update: productData,
      create: {
        id: product.id,
        ...productData
      }
    });
  }
}

async function main(): Promise<void> {
  const brandIds = await upsertBrands();
  const categoryIds = await upsertCategories();
  const sourcePlatformIds = await upsertSourcePlatforms();

  await upsertProducts(brandIds, categoryIds, sourcePlatformIds);

  const [brandCount, categoryCount, sourcePlatformCount, productCount] = await Promise.all([
    prisma.brand.count(),
    prisma.category.count(),
    prisma.sourcePlatform.count(),
    prisma.product.count({
      where: {
        id: {
          in: products.map((product) => product.id)
        }
      }
    })
  ]);

  console.log("Seed completed");
  console.log(
    JSON.stringify(
      {
        seeded: {
          brands: brands.length,
          categories: categories.length,
          sourcePlatforms: sourcePlatforms.length,
          products: products.length
        },
        databaseTotals: {
          brands: brandCount,
          categories: categoryCount,
          sourcePlatforms: sourcePlatformCount,
          seededProducts: productCount
        }
      },
      null,
      2
    )
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
