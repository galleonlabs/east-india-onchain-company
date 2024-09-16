// src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-theme-pan-navy text-theme-pan-navy p-4">
      <div className="container mx-auto flex justify-center items-center">
        <a href="https://x.com/galleonlabs" className="mx-2 hover:text-theme-pan-sky">
          TWITTER
        </a>
        <a href="https://github.com/galleonlabs" className="mx-2 hover:text-theme-pan-sky">
          GITHUB
        </a>
      </div>
    </footer>
  );
};

export default Footer;
