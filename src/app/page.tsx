import Image from "next/image";
import { styled } from "next-yak";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { QUERIES } from "@/lib/constants";

export default function Home() {
  return (
    <main>
      <Hero>
        <div>
          <HeroTitle>Hi, I'm Annie Garvey!</HeroTitle>
          <p>I'm a neurospicy AuDHD woman who loves to code.</p>
        </div>
        <HeroImage
          alt="Independent Curious Professional"
          height={550}
          src="/IndependentCuriousProfessional.png"
          width={550}
        />
      </Hero>
      <Wrapper>
        <p>
          I'm passionate about accessibility and making a great user experience
          for everyone, building neurodiversity knowledge and awareness, and
          protecting the environment.
        </p>
        <p>
          I also love music, singing, dancing, kayaking, baking, and pretty much
          any kind of crafting I've tried! I enjoy reading or watching sci-fi
          (particularly post-apocalyptic or space operas) and fantasy
          (especially if there are dragons or faeries involved!). I am proud of
          my Irish heritage. Currently enjoying learning{" "}
          <a href="https://www.joshwcomeau.com/blog/whimsical-animations/">
            Whimsical Animations by Josh Comeau
          </a>
          .
        </p>
      </Wrapper>
    </main>
  );
}

const Hero = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-inline: 64px;
  background-color: var(--color-primary-950);
  font-size: 1.3rem;
  color: var(--color-primary-100);
  overflow: clip;

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-tangerine), cursive;
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 32px;
  padding-top: 32px;
  line-height: 1;
`;

const HeroImage = styled(Image)`
  display: block;
  max-height: clamp(100px, 50vw, 66vh);
  filter: drop-shadow(2px 4px 32px rgba(0, 0, 0, 0.8));
  object-fit: contain;

  @media (${QUERIES.TABLET_UP}) {
    margin-right: -64px;
  }
`;

const Wrapper = styled(MaxWidthWrapper)`
  margin-block: 32px;
  p {
    margin-block: 16px;
  }
  a {
    color: light-dark(var(--color-primary-800), var(--color-primary-400));
  }
`;
