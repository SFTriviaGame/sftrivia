export default function CheckEmailPage() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        backgroundColor: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <div
          style={{ fontSize: "3rem", marginBottom: "1.5rem" }}
          aria-hidden="true"
        >
          ✉️
        </div>

        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "2rem",
            color: "#252018",
            marginBottom: "0.75rem",
            fontWeight: 400,
          }}
        >
          Check your email
        </h1>

        <p
          style={{
            color: "#737373",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          We sent you a magic link. Tap it to sign in.
          <br />
          <span style={{ fontSize: "0.875rem" }}>
            It expires in 24 hours. Check your spam folder if you don&apos;t see it.
          </span>
        </p>
<a

          href="/login"
          style={{
            display: "inline-block",
            color: "#b45309",
            fontSize: "0.875rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          &larr; Try a different email
        </a>
      </div>
    </main>
  );
}
