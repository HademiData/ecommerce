import { ArrowDownRight, ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import heroOne from '../../../assets/ratech-hero.jpg'
import heroTwo from '../../../assets/ratech-hero2.jpg'
import heroThree from '../../../assets/ratech-hero3.jpg'
import heroFour from '../../../assets/ratech-hero4.jpg'
import heroFive from '../../../assets/ratech-hero5.jpg'
import type { HomeProduct } from '../types'
import './HeroSection.css'

const originalHeroImages = [heroOne, heroTwo, heroThree, heroFour, heroFive]

export default function HeroSection({ products }: { products: HomeProduct[] }) {
  const [currentImage, setCurrentImage] = useState(0)
  const [previousImage, setPreviousImage] = useState<number | null>(null)
  const slides = useMemo(
    () => [
      ...originalHeroImages.map((src, index) => ({ id: `hero-${index}`, src })),
      ...products.flatMap((product) =>
        product.images.map((src, index) => ({
          id: `${product._id}-${index}`,
          src,
        })),
      ),
    ],
    [products],
  )

  useEffect(() => {
    if (slides.length < 2) return

    const intervalId = window.setInterval(() => {
      setCurrentImage((current) => {
        const currentIndex = current % slides.length
        setPreviousImage(currentIndex)
        return (currentIndex + 1) % slides.length
      })
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [slides.length])

  const currentSlide = slides[currentImage % slides.length]
  const previousSlide = previousImage === null
    ? undefined
    : slides[previousImage % slides.length]

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-background" aria-hidden="true">
        {previousSlide && (
          <img
            key={`prev-${previousSlide.id}`}
            className="hero-image hero-image-previous"
            src={previousSlide.src}
            alt=""
          />
        )}

        {currentSlide && (
          <img
            key={`curr-${currentSlide.id}`}
            className="hero-image hero-image-current"
            src={currentSlide.src}
            alt=""
            fetchPriority="high"
          />
        )}
      </div>

      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-eyebrow">TECHNOLOGY FOR MODERN LIVING</p>

        <h1 id="hero-title">
          SMARTER PRODUCTS
          <br />
          <span>BETTER EVERYDAY.</span>
        </h1>

        <p className="hero-description">
          Discover thoughtfully selected gadgets and accessories that make
          everyday life work better.
        </p>

        <div className="hero-actions">
          <a className="hero-primary" href="#shop">
            Explore the collection
            <ArrowRight size={18} />
          </a>

          <a className="hero-secondary" href="#categories">
            Discover Ràtech
          </a>
        </div>
      </div>

      <div className="hero-bottom">
        <span>BUILT AROUND YOUR EVERYDAY</span>

        <a href="#categories" aria-label="Scroll to shop">
          SCROLL TO EXPLORE
          <ArrowDownRight size={17} />
        </a>
      </div>

      <span className="hero-index" aria-hidden="true">
        {String((currentImage % slides.length) + 1).padStart(2, '0')}
        {' / '}
        {String(slides.length).padStart(2, '0')}
      </span>
    </section>
  )
}
