
import './BrandStory.css'

const BrandStory = () => {
  return (
    <section className="brand-story" id="about">
      <div className="brand-story-image">
        <img
          src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1600&q=85"
          alt="Thoughtfully arranged modern workspace"
          loading="lazy"
        />

        <span className="brand-story-image-label">
          DESIGNED FOR DAILY LIFE
        </span>
      </div>

      <div className="brand-story-content">
        <p className="brand-story-eyebrow">THE RÀTECH APPROACH</p>

        <h2>
          Less clutter.
          <br />
          <span>More possibility.</span>
        </h2>

        <p className="brand-story-description">
          The right products can make everyday life feel simpler.
          We bring together technology, useful accessories and
          thoughtful essentials for the way you live and work.
        </p>

        <a className="brand-story-link" href="/shop">
          Explore the collection
          <span aria-hidden="true">↗</span>
        </a>

        <div className="brand-story-footer">
          <span>01</span>
          <span>TECHNOLOGY FOR EVERYDAY LIFE</span>
        </div>
      </div>
    </section>
  )
}

export default BrandStory
