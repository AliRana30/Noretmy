// components/BlogList.tsx
import React from 'react';
import Link from 'next/link';

// Types for our blog data
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  imageUrl: string;
  slug: string;
}

// Sample blog data
const dummyBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How to Build a Modern Next.js Application',
    excerpt:
      'Learn the best practices for creating fast, responsive applications with Next.js and React.',
    author: 'Jane Smith',
    date: 'February 28, 2025',
    readTime: '5 min read',
    category: 'Development',
    imageUrl:
      'https://res.cloudinary.com/dhcylxn8c/image/upload/v1732376002/uploads/vfehz3qrndenmvwyb3lv.png',
    slug: 'how-to-build-modern-nextjs-application',
  },
  {
    id: '2',
    title: 'The Future of Web Design in 2025',
    excerpt:
      'Exploring the latest trends and technologies shaping the future of web design this year.',
    author: 'John Doe',
    date: 'February 20, 2025',
    readTime: '8 min read',
    category: 'Design',
    imageUrl:
      'https://res.cloudinary.com/dhcylxn8c/image/upload/v1732376002/uploads/vfehz3qrndenmvwyb3lv.png',
    slug: 'future-of-web-design-2025',
  },
  {
    id: '3',
    title: 'Optimizing Performance in React Applications',
    excerpt:
      'Practical strategies to improve performance and user experience in your React projects.',
    author: 'Alex Chen',
    date: 'February 15, 2025',
    readTime: '6 min read',
    category: 'Performance',
    imageUrl:
      'https://res.cloudinary.com/dhcylxn8c/image/upload/v1732376002/uploads/vfehz3qrndenmvwyb3lv.png',
    slug: 'optimizing-performance-react-applications',
  },
];

const BlogList: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Featured Article */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          Featured Article
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative h-64 lg:h-full">
            <img
              src={dummyBlogPosts[0].imageUrl}
              alt={dummyBlogPosts[0].title}
              className="rounded-lg object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-indigo-600 mb-2">
              {dummyBlogPosts[0].category}
            </span>
            <Link href={`/blog/${dummyBlogPosts[0].slug}`} className="group">
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-3">
                {dummyBlogPosts[0].title}
              </h3>
            </Link>
            <p className="text-gray-600 mb-4">{dummyBlogPosts[0].excerpt}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>{dummyBlogPosts[0].author}</span>
              <span className="mx-2">•</span>
              <span>{dummyBlogPosts[0].date}</span>
              <span className="mx-2">•</span>
              <span>{dummyBlogPosts[0].readTime}</span>
            </div>
            <Link
              href={`/blog/${dummyBlogPosts[0].slug}`}
              className="mt-4 inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800"
            >
              Read more
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Articles */}
      <div>
        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          Latest Articles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dummyBlogPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-6">
                <span className="text-xs font-medium text-indigo-600 mb-2 block">
                  {post.category}
                </span>
                <Link href={`/blog/${post.slug}`} className="group">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{post.author}</span>
                  <span className="mx-2">•</span>
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="mt-16 bg-indigo-50 rounded-xl p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Subscribe to our newsletter
          </h3>
          <p className="text-gray-600 mb-6">
            Get the latest articles and resources sent to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogList;
