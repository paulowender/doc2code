import Link from "next/link";
import MainLayout from "@/components/MainLayout";
import { CodeIcon, FileJson, FileText, Code2 } from "lucide-react";

export default function Home() {
  const tools = [
    {
      name: "doc2service",
      description:
        "Convert documentation into ready-to-use SDKs with AI integration",
      icon: (
        <FileJson className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      ),
      href: "/doc2service",
    },
    // More tools can be added here in the future
  ];

  return (
    <MainLayout>
      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">doc2code</span>
              <span className="block text-indigo-600 dark:text-indigo-400">
                Developer Tools Hub
              </span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              A collection of powerful tools for developers, powered by AI
              integration
            </p>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">
              Tools
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Boost your development workflow
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Our tools help you streamline your development process and
              increase productivity
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {tools.map((tool) => (
                <div key={tool.name} className="relative">
                  <Link href={tool.href}>
                    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-800">
                      <div>
                        <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 dark:bg-indigo-600 text-white">
                          {tool.icon}
                        </div>
                        <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </p>
                      </div>
                      <div className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-700 dark:bg-indigo-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-indigo-200">
              Start using our tools today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/doc2service"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
