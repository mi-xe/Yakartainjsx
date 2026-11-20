import Navbar from './Navbar';

export default function PageLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
