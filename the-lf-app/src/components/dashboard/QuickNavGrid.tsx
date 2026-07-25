import { ArrowUpRight, Bookmark, BookOpen, Timer, Video } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/timer",
    title: "Start a session",
    subtitle: "Timer, scrambles and live averages",
    Icon: Timer,
    tone: "mint",
    index: "01",
  },
  {
    href: "/analysis",
    title: "Analyse a solve",
    subtitle: "Get focused feedback from your video",
    Icon: Video,
    tone: "coral",
    index: "02",
  },
  {
    href: "/learn",
    title: "Keep learning",
    subtitle: "Follow a track at your own pace",
    Icon: BookOpen,
    tone: "lilac",
    index: "03",
  },
  {
    href: "/library",
    title: "Open library",
    subtitle: "Your saved videos and scrambles",
    Icon: Bookmark,
    tone: "sun",
    index: "04",
  },
] as const;

export function QuickNavGrid() {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section__heading">
        <div>
          <span className="dashboard-kicker">Jump back in</span>
          <h2>What do you want to work on?</h2>
        </div>
        <p>Pick up a focused activity without digging through menus.</p>
      </div>

      <div className="quick-action-grid">
        {NAV_ITEMS.map(({ href, title, subtitle, Icon, tone, index }) => (
          <Link
            key={href}
            href={href}
            className={`quick-action quick-action--${tone}`}
          >
            <div className="quick-action__top">
              <span className="quick-action__icon">
                <Icon size={21} />
              </span>
              <span className="quick-action__index">{index}</span>
            </div>
            <div className="quick-action__copy">
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
            <ArrowUpRight className="quick-action__arrow" size={19} />
          </Link>
        ))}
      </div>
    </section>
  );
}
