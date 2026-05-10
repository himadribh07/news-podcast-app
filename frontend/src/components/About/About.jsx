import React from 'react';
import './About.css';

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
                  plain language, and ends in under seven minutes.
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
                  seven minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sig-about__stats">
          <div className="sig-about__stat">
            <div className="sig-about__stat-num">
              ~7<span>min</span>
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

    </section>
  );
}