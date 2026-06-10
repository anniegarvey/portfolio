import { Github, Linkedin } from "lucide-react";
import { styled } from "next-yak";
import { FadeIn } from "@/components/FadeIn";
import { GITHUB_URL, LINKEDIN_URL } from "@/lib/constants";

export function ContactSection() {
  return (
    <Contact aria-label="Get in touch">
      <FadeIn>
        <Inner>
          <Heading>Let&apos;s build something worth talking about</Heading>
          <Tagline>
            Got an idea, a role, or just a good chat in mind? I&apos;d love to
            hear from you.
          </Tagline>
          <ContactLinks>
            <ContactLink
              aria-label="GitHub profile"
              href={GITHUB_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github aria-hidden="true" size={20} />
              GitHub
            </ContactLink>
            <ContactLink
              aria-label="LinkedIn profile"
              href={LINKEDIN_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Linkedin aria-hidden="true" size={20} />
              LinkedIn
            </ContactLink>
          </ContactLinks>
        </Inner>
      </FadeIn>
    </Contact>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Contact = styled.section`
  display: flex;
  justify-content: center;
  padding: 80px 48px;
  background-color: var(--color-primary-950);
  color: var(--color-primary-100);
  text-wrap: balance;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  max-width: 55ch;
`;

const Heading = styled.h2`
  font-family: var(--font-tangerine), cursive;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.05;
`;

const Tagline = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-primary-200);
`;

const ContactLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary-950);
  background-color: var(--color-primary-200);
  text-decoration: none;
  transition:
    filter 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);

  &:hover {
    filter: brightness(1.12);
    transform: translateY(-2px);
  }
`;
