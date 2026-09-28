import smileySvg from "../../assets-src/svg/smiley.svg?raw";
import "./home.css";

/**
 * Home (spec §7). The full transit map and the name block are shared chrome;
 * this page holds the smiley and, later, the "who?" spray.
 * After the gate, the smiley enters with the gate → home timeline.
 * TODO(milestone 5): "who?" spray canvas.
 */
export default function Home() {
  return (
    <div className="home">
      <div className="home__smiley" aria-hidden="true" dangerouslySetInnerHTML={{ __html: smileySvg }} />
    </div>
  );
}
