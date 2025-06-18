import pkg from "../../../package.json";

export default function Footer() {
  return (
    <footer className="border-t border-gray-300">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-8 md:flex-row md:justify-center md:px-12">
        <div className="text-center md:text-left">
          <span className="text-lg font-semibold">網站名稱</span>
          <p className="mt-1">All rights reserved 2025</p>
          <p className="">{`Web version: ${pkg.version}`}</p>
        </div>
      </div>
    </footer>
  );
}
