// src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-terminal text-terminal p-4">
      <div className="container mx-auto flex justify-center items-center">
        <a href="https://x.com/galleonlabs" className="mx-2 hover:text-green-300">
          TWITTER
        </a>
        <a href="https://github.com/galleonlabs" className="mx-2 hover:text-green-300">
          GITHUB
        </a>
      </div>
    </footer>
  );
};

export default Footer;
