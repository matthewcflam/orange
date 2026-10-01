import StationLayout from "./StationLayout";
import TrainLine from "./TrainLine";

/** About (design/mockups-v2/About (1).png). The copy after "I like beautiful
 *  software, and" is placeholder, reaching about halfway down the page. */
export default function About() {
  return (
    <StationLayout title="About">
      <div className="station-copy about__copy">
        <p>My name is Matthew. I’m in my third year studying computer engineering at the University of British Columbia.</p>
        {/* TODO(open-question #15): placeholder copy from here on. */}
        <p>
          I like beautiful software, and the small details that make it feel alive: a sound that lands exactly when you
          click, a line that moves like something with weight.
        </p>
        <p>
          Placeholder: a few sentences about what I’m building right now, what I want to work on next, and the kind of
          team I’d love to join.
        </p>
        <p>Placeholder: something about life outside of school (sailing, swimming, transit maps).</p>
      </div>
      <TrainLine className="about__line" />
    </StationLayout>
  );
}
