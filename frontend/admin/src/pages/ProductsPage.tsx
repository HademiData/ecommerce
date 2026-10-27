import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { createProduct, deleteProduct, updateProduct } from '../services/productService'
import type { NewProduct } from '../services/productService'
import type { Product } from '../types'

type Props = {
  products: Product[]
  loading: boolean
  error: string
  search: string
  accessToken: string | null
  onProductsChanged: () => void
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  sku: '',
  stock: '',
  images: '',
  badge: '',
}

export default function ProductsPage({
  products,
  loading,
  error,
  search,
  accessToken,
  onProductsChanged,
}: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const filtered = products.filter((product) => `${product.name} ${product.category} ${product.sku}`.toLowerCase().includes(search.toLowerCase()))

  function openCreateForm() {
    setForm(emptyForm)
    setEditingProduct(null)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(product: Product) {
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      category: product.category,
      sku: product.sku,
      stock: String(product.stock),
      images: product.images?.join('\n') ?? '',
      badge: product.badge ?? '',
    })
    setEditingProduct(product)
    setFormError('')
    setActionError('')
    setIsFormOpen(true)
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accessToken) {
      setFormError('Your session has expired. Please sign in again.')
      return
    }

    const newProduct: NewProduct = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      sku: form.sku.trim(),
      stock: Number(form.stock),
      images: form.images.split(/\r?\n/).map((image) => image.trim()).filter(Boolean),
      badge: form.badge.trim(),
    }

    setFormError('')
    setIsSubmitting(true)
    try {
      if (editingProduct) {
        await updateProduct(accessToken, editingProduct._id, newProduct)
      } else {
        await createProduct(accessToken, newProduct)
      }
      setForm(emptyForm)
      setIsFormOpen(false)
      setEditingProduct(null)
      onProductsChanged()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to save product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!accessToken) {
      setActionError('Your session has expired. Please sign in again.')
      return
    }
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return

    setActionError('')
    setDeletingProductId(product._id)
    try {
      await deleteProduct(accessToken, product._id)
      if (editingProduct?._id === product._id) {
        setIsFormOpen(false)
        setEditingProduct(null)
      }
      onProductsChanged()
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete product.')
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <section className="panel orders-panel">
      <div className="panel-heading">
        <div><h2>Product inventory</h2><p>Products loaded from the product service.</p></div>
        <div className="products-heading-actions">
          <strong>{products.length} products</strong>
          <button
            className="primary-button"
            type="button"
            onClick={isFormOpen && !editingProduct
              ? () => setIsFormOpen(false)
              : openCreateForm}
            aria-expanded={isFormOpen}
          >
            {isFormOpen && !editingProduct ? <X size={15} /> : <Plus size={15} />}
            {isFormOpen && !editingProduct ? 'Close' : 'Add product'}
          </button>
        </div>
      </div>
      {isFormOpen && (
        <form className="product-create-form" onSubmit={handleSaveProduct}>
          <h3 className="product-form-title">{editingProduct ? 'Edit product' : 'Add product'}</h3>
          <div className="product-form-grid">
            <label>
              Product name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={150}
                required
              />
            </label>
            <label>
              SKU
              <input
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
                required
              />
            </label>
            <label>
              Category
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
              />
            </label>
            <label>
              Price (NGN)
              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                required
              />
            </label>
            <label>
              Badge <span>(optional)</span>
              <input
                value={form.badge}
                onChange={(event) => setForm({ ...form, badge: event.target.value })}
                maxLength={60}
              />
            </label>
            <label className="product-form-wide">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                maxLength={2000}
                rows={3}
                required
              />
            </label>
            <label className="product-form-wide">
              Image URLs <span>(one URL per line)</span>
              <textarea
                value={form.images}
                onChange={(event) => setForm({ ...form, images: event.target.value })}
                rows={2}
                placeholder="https://example.com/product-image.jpg"
              />
            </label>
          </div>
          {formError && <p className="product-form-error" role="alert">{formError}</p>}
          <div className="product-form-actions">
            <button
              className="date-button"
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setEditingProduct(null)
                setForm(emptyForm)
                setFormError('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save changes' : 'Save product'}
            </button>
          </div>
        </form>
      )}
      {loading && <p className="muted">Loading products...</p>}
      {error && <p className="login-notice" role="alert">{error}</p>}
      {actionError && <p className="product-form-error" role="alert">{actionError}</p>}
      {!loading && !error && <div className="table-scroll"><table>
        <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map(product => <tr key={product._id}>
            <td><strong>{product.name}</strong></td><td>{product.sku}</td><td>{product.category}</td>
            <td className="amount">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(product.price)}</td>
            <td>{product.stock}</td>
            <td><span className={`status-pill ${!product.isActive ? 'status-cancelled' : product.stock === 0 ? 'status-cancelled' : product.stock < 5 ? 'status-pending' : 'status-confirmed'}`}>{!product.isActive ? 'Inactive' : product.stock === 0 ? 'Out of stock' : product.stock < 5 ? 'Low stock' : 'In stock'}</span></td>
            <td>
              <div className="product-row-actions">
                <button
                  className="product-action-button"
                  type="button"
                  onClick={() => openEditForm(product)}
                  aria-label={`Edit ${product.name}`}
                  title="Edit product"
                  disabled={deletingProductId !== null}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="product-action-button product-delete-button"
                  type="button"
                  onClick={() => void handleDeleteProduct(product)}
                  aria-label={`Delete ${product.name}`}
                  title="Delete product"
                  disabled={deletingProductId !== null}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </td>
          </tr>)}
          {filtered.length === 0 && <tr><td colSpan={7} className="empty-row">No products found.</td></tr>}
        </tbody>
      </table></div>}
    </section>
  )
}
