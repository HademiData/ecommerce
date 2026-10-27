export type HomeProduct = {
  _id: string
  name: string
  description: string
  price: number
  category: string
  images: string[]
  badge?: string
}

export type HomeProductResponse = {
  data: HomeProduct[]
}
