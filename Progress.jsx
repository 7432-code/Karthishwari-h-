export default function Progress({ loading, text }) {
  if (!loading) return null;

  return (
    <div className="progress-card">
      <div className="spinner" />
      <div>
        <strong>ComicCraft is working</strong>
        <p>{text || "Writing your story and generating artwork..."}</p>
      </div>
    </div>
  );
}
