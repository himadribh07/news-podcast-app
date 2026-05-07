import React from 'react';

export default function About() {
  return (
    <section className="sig-about" id="about">
      <div className="sig-wrap">
        <div className="sig-subscribe">
          <div className="sig-section__head">
            <div>
              <div className="sig-eyebrow">◇ About</div>

              <h2 className="sig-section__title">
                Why <span className="sig-it">Signal</span> exists.
              </h2>

              <div className="sig-about__manifesto">
                <p>
                  The news cycle is broken. Twenty open tabs. Three breaking
                  alerts. Nothing that sticks.
                </p>

                <p>
                  Signal picks the stories that{' '}
                  <span className="sig-it">matter</span>, explains them in
                  plain language, and ends in under ten minutes.
                </p>

                <p className="sig-about__tagline">
                  No takes. No outrage. No filler. Just the day, distilled.
                </p>
              </div>
            </div>
          </div>

          <div className="sig-about__how">
            <div className="sig-about__step">
              <div className="sig-about__num">01</div>

              <div>
                <h3>Curate</h3>

                <p>
                  Scan top sources every morning. Filter noise from signal.
                </p>
              </div>
            </div>

            <div className="sig-about__step">
              <div className="sig-about__num">02</div>

              <div>
                <h3>Verify</h3>

                <p>
                  Cross-check facts. No speculation. No “sources say.” Just
                  what&apos;s confirmed.
                </p>
              </div>
            </div>

            <div className="sig-about__step">
              <div className="sig-about__num">03</div>

              <div>
                <h3>Distill</h3>

                <p>
                  One host. Plain language. Every story that mattered, under
                  ten minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sig-about__stats">
          <div className="sig-about__stat">
            <div className="sig-about__stat-num">
              ~10<span>min</span>
            </div>

            <div className="sig-about__stat-label">Avg length</div>
          </div>

          <div className="sig-about__stat">
            <div className="sig-about__stat-num">8</div>

            <div className="sig-about__stat-label">
              Categories covered
            </div>
          </div>

          <div className="sig-about__stat">
            <div className="sig-about__stat-num">
              06<span>:00</span>
            </div>

            <div className="sig-about__stat-label">Drops daily IST</div>
          </div>

          <div className="sig-about__stat">
            <div className="sig-about__stat-num">0</div>

            <div className="sig-about__stat-label">Ads. Ever.</div>
          </div>
        </div>
      </div>

      <style>{`
        .sig-about {
          position: relative;
          padding: 120px 0;
        }

        .sig-subscribe {
          position: relative;
          overflow: hidden;
          isolation: isolate;

          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 80px;
          align-items: center;

          padding: 72px 64px;

          border-radius: 28px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.02) 0%,
              rgba(255,255,255,0.01) 100%
            ),
            var(--bg-2);

          border: 1px solid rgba(255,255,255,0.06);

          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            inset 0 -1px 0 rgba(255,255,255,0.02),
            0 0 0 1px rgba(255,255,255,0.015),
            0 20px 80px rgba(0,0,0,0.45);
        }

        .sig-subscribe::before {
          content: "";
          position: absolute;
          inset: 0;

          border-radius: inherit;
          padding: 1px;

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,0.10),
              rgba(255,255,255,0.02),
              rgba(255,170,70,0.08)
            );

          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);

          -webkit-mask-composite: xor;
          mask-composite: exclude;

          pointer-events: none;
        }

        .sig-subscribe::after {
          content: "";
          position: absolute;
          inset: 0;

          pointer-events: none;

          background:
            radial-gradient(
              circle at top right,
              rgba(255,170,70,0.10),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom left,
              rgba(255,255,255,0.03),
              transparent 30%
            );

          z-index: -1;
        }

        .sig-section__title {
          font-size: clamp(44px, 5vw, 72px);
          line-height: 0.98;
          letter-spacing: -0.05em;
          margin: 18px 0 42px;
          max-width: 720px;
        }

        .sig-about__manifesto p {
          font-family: var(--sans);
          font-size: 21px;
          line-height: 1.6;
          color: var(--fg);
          margin: 0 0 26px;
          letter-spacing: -0.02em;
          max-width: 620px;
        }

        .sig-about__tagline {
          font-family: var(--mono) !important;
          font-size: 12px !important;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent) !important;

          padding-top: 26px;
          margin-top: 36px;

          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .sig-about__how {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .sig-about__step {
          position: relative;

          display: grid;
          grid-template-columns: 70px 1fr;
          gap: 24px;

          padding: 28px;

          border-radius: 22px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.015),
              rgba(255,255,255,0.005)
            );

          border: 1px solid rgba(255,255,255,0.06);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.03),
            0 10px 30px rgba(0,0,0,0.18);

          transition:
            transform 240ms ease,
            border-color 240ms ease,
            background 240ms ease;
        }

        .sig-about__step:hover {
          transform: translateY(-3px);

          border-color: rgba(255,170,70,0.14);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.025),
              rgba(255,255,255,0.01)
            );
        }

        .sig-about__num {
          font-family: var(--serif);
          font-style: italic;
          font-size: 42px;
          line-height: 1;
          color: var(--accent);
          opacity: 0.95;
        }

        .sig-about__step h3 {
          font-size: 19px;
          font-weight: 500;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          color: var(--fg);
        }

        .sig-about__step p {
          font-size: 15px;
          line-height: 1.65;
          color: var(--fg-dim);
          margin: 0;
        }

        .sig-about__stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;

          margin-top: 42px;
        }

        .sig-about__stat {
          position: relative;

          padding: 32px 28px;

          border-radius: 24px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.015),
              rgba(255,255,255,0.005)
            );

          border: 1px solid rgba(255,255,255,0.05);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.03),
            0 10px 30px rgba(0,0,0,0.16);
        }

        .sig-about__stat-num {
          font-size: clamp(42px, 5vw, 64px);
          line-height: 1;
          letter-spacing: -0.06em;
          color: var(--fg);
        }

        .sig-about__stat-num span {
          font-family: var(--mono);
          font-size: 14px;
          margin-left: 4px;
          vertical-align: super;
          color: var(--fg-faint);
          letter-spacing: 0.08em;
        }

        .sig-about__stat-label {
          margin-top: 14px;

          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;

          color: var(--fg-faint);
        }

        @media (max-width: 980px) {
          .sig-subscribe {
            grid-template-columns: 1fr;
            gap: 56px;
            padding: 48px 28px;
          }

          .sig-about__stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .sig-section__title {
            font-size: clamp(40px, 10vw, 64px);
          }

          .sig-about__manifesto p {
            font-size: 18px;
          }
        }

        @media (max-width: 640px) {
          .sig-about {
            padding: 80px 0;
          }

          .sig-subscribe {
            border-radius: 24px;
            padding: 36px 22px;
            gap: 42px;
          }

          .sig-about__step {
            grid-template-columns: 1fr;
            gap: 18px;
            padding: 24px;
          }

          .sig-about__num {
            font-size: 34px;
          }

          .sig-about__stats {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .sig-about__stat {
            padding: 24px;
          }

          .sig-section__title {
            margin-bottom: 28px;
          }
        }
      `}</style>
    </section>
  );
}