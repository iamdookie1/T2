import "./globals.css";

export const metadata = {
  title: "Scroller",
  description: "A simple, ad-free way to scroll Reddit.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
