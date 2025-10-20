import { WalletButton } from './WalletButton';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 bg-white">
      <div className="flex items-center">
        <a href="/" aria-label="home" className="flex items-center">
          <img 
            loading="lazy" 
            src="https://cdn.prod.website-files.com/625db3caa8abd6c22d5f0ce3/668f029c2bb9c2f43db8fe05_Kiln%20-%20logo%20-%202024.svg" 
            alt="KILN" 
            className="h-8 w-auto"
          />
        </a>
      </div>
      <WalletButton />
    </header>
  );
}
