import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

// Fallback chapter captions used when an image on /our-story has no title/body
// set in the CMS. Sits in the same house voice as the rest of the site — the
// coastal Diu origin story, told in short paragraphs. Ordered by position, so
// they read as a narrative even if the admin uploads all the photos at once.
const FALLBACK_CHAPTERS = [
  {
    title: 'Where the Arabian Sea meets Diu',
    body: 'Long before Chhatak had a name, Bombil — Bombay Duck — was a staple in the Portuguese quarter of Diu. Fishermen returned at dawn, silver hulls low in the water, and the town woke to the smell of the sea. That morning is where our recipe begins.',
  },
  {
    title: 'The morning catch',
    body: 'Bombil is fragile and quick to spoil, which is why Diu learned early to dry it on bamboo rails in the sea breeze. What began as preservation became flavour — sun, salt and coastal air turning a modest fish into something you crave for a lifetime.',
  },
  {
    title: 'On the deck, at sunrise',
    body: 'The boats come back full and the crew celebrates the way coastal crews always have — with a shout, a dance, and the first taste of what they caught. That joy sits inside every packet of Chhatak: this snack was born in delight, not in a factory.',
  },
  {
    title: 'Sun and salt do the work',
    body: 'We still dry our Bombil the old way — hung on wooden racks along the shore, cured by nothing but sunlight and sea wind. No shortcuts, no ovens. It takes a full day, and it makes all the difference in the crunch.',
  },
  {
    title: 'From the harbour to the kitchen',
    body: 'Once dry, the fish moves inland to our small kitchen. Here we sort by hand, cut to bite size, and set aside anything that isn\'t perfect. What passes gets one thing next: the spice.',
  },
  {
    title: 'Bold Indian spice, coastal soul',
    body: 'Our masala is toasted fresh — Kashmiri chilli for colour, coriander for sweetness, a whisper of asafoetida, black pepper for kick. It clings to every strand of Bombil, so every bite carries the whole coast in it.',
  },
  {
    title: 'The women who built the recipe',
    body: 'The blend comes from grandmothers in the Diu quarter — women who spent lifetimes teaching daughters and daughters-in-law exactly how much of each spice to add. We didn\'t invent Chhatak. We wrote down what they already knew, and packed it for the world.',
  },
  {
    title: 'From the coast · Diu',
    body: 'Every packet you open was pulled from the Arabian Sea, dried on our shore, hand-spiced in our kitchen, and sealed the same day. No preservatives. No mystery ingredients. Just the coast — crisp, spicy, addictive.',
  },
];

export default function OurStoryPage() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Our Story — Chhatak';
    window.scrollTo(0, 0);
    api.get('/landing/sections').then(({ data }) => {
      const sections = data || [];
      const ourStory = sections.find((s) => s.key === 'our-story');
      const fallback = sections.find((s) => s.key === 'story');
      const source = (ourStory?.images?.length ? ourStory : fallback);
      const imgs = source?.images || [];
      setChapters(imgs);
    }).catch(() => setChapters([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="our-story-page">
      <div className="v2-container our-story-container">
        <p className="v2-kicker accent">OUR STORY</p>
        <h1 className="our-story-title">Born on the coast.<br />Made for everyone.</h1>
        <p className="our-story-lede">
          From the fishermen's daily catch to your hands, Chhatak brings you the authentic
          taste of Bombil with a crunchy twist — a snack that fits every mood, every meal,
          every moment.
        </p>

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>Loading…</p>
        ) : chapters.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>
            Story chapters haven't been added yet. Set them up in <em>Admin → UI/UX → Our Story chapters</em>.
          </p>
        ) : (
          <div className="our-story-chapters">
            {chapters.map((img, i) => {
              // Prefer whatever the admin typed in the CMS; if a field is blank,
              // fall back to the narrative caption for this chapter position.
              // The last fallback repeats if there are more images than chapters.
              const fb = FALLBACK_CHAPTERS[Math.min(i, FALLBACK_CHAPTERS.length - 1)];
              const title = img.title || fb.title;
              const body  = img.body  || fb.body;
              return (
                <article className="our-story-chapter" key={img.id ?? i}>
                  <div className="our-story-chapter__media">
                    {img.media_type === 'video' ? (
                      <video src={img.image_url} muted playsInline autoPlay loop />
                    ) : (
                      <img
                        src={img.image_url}
                        alt={title || `Chhatak story chapter ${i + 1}`}
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                    )}
                  </div>
                  <div className="our-story-chapter__caption">
                    {title && <h2 className="our-story-chapter__title">{title}</h2>}
                    {body && <p className="our-story-chapter__body">{body}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="our-story-cta">
          <Link to="/products" className="v2-btn v2-btn--primary">SHOP THE RANGE</Link>
          <Link to="/" className="v2-btn v2-btn--outline">BACK HOME</Link>
        </div>
      </div>
    </div>
  );
}
