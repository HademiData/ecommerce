import { readFile } from 'node:fs/promises'
import mongoose from 'mongoose'

const homepageProducts = [
  {
    name: 'Wireless Headphones',
    category: 'Audio',
    price: 85000,
    sku: 'HOME-WIRELESS-HEADPHONES',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    badge: 'NEW ARRIVAL',
    description: 'Your everyday soundtrack, designed for focus, comfort and life on the move.',
  },
  {
    name: 'Minimal Desk Lamp',
    category: 'Home & Living',
    price: 42000,
    sku: 'HOME-MINIMAL-DESK-LAMP',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85',
    badge: 'THOUGHTFUL DESIGN',
    description: 'A clean, modern accent for focused work and relaxed evenings at home.',
  },
  {
    name: 'Everyday Backpack',
    category: 'Accessories',
    price: 65000,
    sku: 'HOME-EVERYDAY-BACKPACK',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
    badge: 'EVERYDAY ESSENTIAL',
    description: 'Carry your daily essentials with a versatile design made for moving around.',
  },
  {
    name: 'Smart Watch',
    category: 'Wearables',
    price: 120000,
    sku: 'HOME-SMART-WATCH',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
    badge: 'NEW ARRIVAL',
    description: 'A minimal everyday companion that brings style to your daily routine.',
  },
  {
    name: 'Mechanical Keyboard',
    category: 'Computing',
    price: 75000,
    sku: 'HOME-MECHANICAL-KEYBOARD',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
    badge: 'NEW ARRIVAL',
    description: 'A refined keyboard for comfortable typing and a more considered workspace.',
  },
  {
    name: 'Laptop Stand',
    category: 'Workspace',
    price: 35000,
    sku: 'HOME-LAPTOP-STAND',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85',
    badge: 'WORKSPACE PICK',
    description: 'Give your desk a cleaner setup with a practical laptop stand.',
  },
  {
    name: 'Bluetooth Speaker',
    category: 'Audio',
    price: 55000,
    sku: 'HOME-BLUETOOTH-SPEAKER',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85',
    badge: 'POPULAR',
    description: 'Bring your favourite music into your everyday spaces.',
  },
  {
    name: 'Wireless Mouse',
    category: 'Computing',
    price: 28000,
    sku: 'HOME-WIRELESS-MOUSE',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=85',
    badge: '',
    description: 'A simple everyday companion for productive work and browsing.',
  },
  {
    name: 'USB-C Hub',
    category: 'Accessories',
    price: 32000,
    sku: 'HOME-USB-C-HUB',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=85',
    badge: '',
    description: 'Connect more of your everyday devices with one compact accessory.',
  },
  {
    name: 'Desktop Monitor',
    category: 'Computing',
    price: 280000,
    sku: 'HOME-DESKTOP-MONITOR',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
    badge: 'WORKSPACE PICK',
    description: 'Create more room for work, creativity and everyday computing.',
  },
]

async function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI

  let envFile
  try {
    envFile = await readFile(new URL('../.env', import.meta.url), 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const value = envFile
    ?.match(/^\s*MONGODB_URI\s*=\s*(.*?)\s*$/m)?.[1]
    ?.replace(/^(['"])(.*)\1$/, '$2')

  if (!value) {
    throw new Error('Set MONGODB_URI or add it to backend/product-service/.env.')
  }

  return value
}

const uri = await getMongoUri()
const now = new Date()

try {
  await mongoose.connect(uri)
  const collection = mongoose.connection.collection('products')
  const result = await collection.bulkWrite(
    homepageProducts.map(({ image, ...product }) => ({
      updateOne: {
        filter: { sku: product.sku },
        update: {
          $setOnInsert: {
            ...product,
            images: [image],
            stock: 10,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: true },
  )

  console.log(
    `Homepage catalog ready: ${result.upsertedCount} inserted, ${result.matchedCount} already present.`,
  )
} finally {
  await mongoose.disconnect()
}
