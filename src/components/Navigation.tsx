import Image from "next/image";
import Link from "next/link";
import { styled } from "next-yak";

export default function Navigation() {
  return (
    <Header>
      <Side>
        <LogoLink aria-label="Home" href="/">
          <StyledImage
            alt="Annie Garvey Girl Coding"
            height={180}
            src="/AnnieGarveyLogo.png"
            width={320}
          />
        </LogoLink>
      </Side>
      <Nav aria-label="Main navigation">
        <NavList>
          <NavItem>
            <NavLink href="/">Home</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/colour-palette">Colour Palette</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/energy-planner">Energy Planner</NavLink>
          </NavItem>
        </NavList>
      </Nav>
      <Side />
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  padding: 1rem;
  background-color: var(--color-grey-900);
  border-bottom: 1px solid var(--color-grey-700);
`;

const Side = styled.div`
  flex: 1;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
`;

const LogoLink = styled(Link)`
  transition: opacity 600ms ease;
  animation: fadeFromTransparent 600ms ease;

  &:hover {
    opacity: 0.8;
    transition-duration: 300ms;
  }
`;

const StyledImage = styled(Image)`
  height: 5rem;
  width: auto;
  margin-block: -8px;
`;

const NavList = styled.ul`
  display: flex;
  gap: 1rem;
  list-style: none;
  padding-left: 1rem;
`;

const NavItem = styled.li`

`;

const NavLink = styled(Link)`
  color: var(--color-grey-100);
  font-weight: 700;
  font-size: 1.6rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;

  &:hover,
  &:focus {
    background-color: var(--color-primary-700);
    color: var(--color-primary-100);
    
  }
`;
