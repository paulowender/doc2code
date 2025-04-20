'use client';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} doc2code. All rights reserved.
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            A hub of developer tools with AI integration
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
