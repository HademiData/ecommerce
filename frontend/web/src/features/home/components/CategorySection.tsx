
import type { HomeProduct } from '../types'
import './CategorySection.css';

const categories = [
  {
    title: 'Mobile & Audio',
    productCategory: 'Audio',
    description: 'Phones, earbuds and everyday accessories.',
    href: '/shop?category=mobile-audio',
  },
  {
    title: 'Computing',
    productCategory: 'Computing',
    description: 'Laptops, monitors and workspace essentials.',
    href: '/shop?category=computing',
  },
  {
    title: 'Home & Kitchen',
    productCategory: 'Home & Living',
    description: 'Smarter tools for your everyday living.',
    href: '/shop?category=home-kitchen',
  },
  {
    title: 'Power Essentials',
    productCategory: 'Accessories',
    description: 'Power solutions for life on the move.',
    href: '/shop?category=power-essentials',
  },
];

export default function CategorySection({ products }: { products: HomeProduct[] }) {
  return (
    <section className="category-section" id="categories">
      <header className="category-header">
        <p className="category-eyebrow">CURATED FOR EVERYDAY</p>
        <h2>Find your next essential.</h2>
        <p className="category-intro">
          Explore technology for work, home and everyday life.
        </p>
      </header>

      <div className="category-grid">
        {categories.map((category) => {
          const image = products.find(
            (product) =>
              product.category === category.productCategory &&
              product.images[0],
          )?.images[0]

          return (
            <a
              className="category-card"
              href={category.href}
              key={category.title}
            >
              {image && (
                <img
                  className="category-image"
                  src={image}
                  alt=""
                  loading="lazy"
                />
              )}

              <div className="category-card-overlay" />

              <div className="category-card-content">
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>

                <span className="category-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  );
}
