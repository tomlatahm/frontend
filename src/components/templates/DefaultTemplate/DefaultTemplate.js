import { Header } from "components";
import styled from "@xstyled/styled-components";

const FixedHeaderTemplate = styled.div`
  padding-top: 56px;
  min-height: 100vh;
`;

export const DefaultTemplate = ({ children }) => {
  return (
    <>
      <Header />
      <FixedHeaderTemplate>{children}</FixedHeaderTemplate>
    </>
  );
};
