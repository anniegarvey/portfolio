import Image from "next/image";
import { styled } from "next-yak";
import MaxWidthWrapper from "../components/MaxWidthWrapper";

export default function Home() {
  return (
    <main>
      <Hero>
        <div>
          <HeroTitle>Hi, I'm Annie Garvey!</HeroTitle>
          <p>
            I'm a neurospicy AuDHD girl who loves to code. I'm passionate about
            accessibility and making a great user experience for everyone,
            building neurodiversity knowledge and awareness, and protecting the
            environment. I also love music, singing, dancing, kayaking, baking,
            and pretty much any kind of crafting I've tried! I enjoy reading or
            watching sci-fi (particularly post-apocalyptic or space operas) and
            fantasy (especially if there are dragons or faeries involved!). I am
            proud of my Irish heritage. Currently enjoying learning whimsical
            CSS animations.
          </p>
        </div>
        <HeroImage
          alt="Independent Curious Professional"
          height={550}
          src="/IndependentCuriousProfessional.png"
          width={550}
        />
      </Hero>
      <MaxWidthWrapper>
        <p>some more page content here...</p>
      </MaxWidthWrapper>
    </main>
  );
}

const Hero = styled.section`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-inline: 64px;
  background-color: var(--color-primary-950);
  font-size: 1.3rem;
  color: var(--color-primary-100);
  overflow: clip;
`;

const HeroTitle = styled.h1`
  font-family: cursive;
`;

const HeroImage = styled(Image)`
  display: block;
  max-height: clamp(100px, 50vw, 66vh);
  filter: drop-shadow(2px 4px 32px rgba(0, 0, 0, 0.8));
  margin-right: -64px;
`;
