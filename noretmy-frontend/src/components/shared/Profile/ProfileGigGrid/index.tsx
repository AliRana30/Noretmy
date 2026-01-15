'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaShareAlt, FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { Loader2, PlusCircle } from "lucide-react";
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface Gig {
  _id: string;
  title: string;
  imageUrl: string;
  photos: string[];
}

const Gigs: React.FC = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/job/user`, {
        withCredentials: true,
      });
      setGigs(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this gig?');
    if (confirmDelete) {
      try {
        setDeleteLoading(id);
        await axios.delete(`${BASE_URL}/job/${id}`, {
          withCredentials: true,
        });
        setGigs((prevGigs) => prevGigs.filter((gig) => gig._id !== id));
        toast.success('Gig deleted successfully');
      } catch (error) {
        toast.error('Failed to delete gig. Please try again.');
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleEdit = (id: string) => {
    window.location.href = `/edit-gig/${id}`;
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/gig/${id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Gig link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" id="gigs">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black">
          Your <span className="text-orange-600">Gigs</span>
        </h2>
        <Link
          href="/promote-gigs"
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
        >
          <PlusCircle size={20} />
          <span>Promote Gigs</span>
        </Link>
        {/* {gigs.length < 5 && (
          <Link href="/create-new">
            <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md">
              <FaPlus size={14} />
              <span className="font-medium">Create New</span>
            </button>
          </Link>
        )} */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className='h-6 w-6 animate-spin' />
            <p className="mt-4 text-gray-600">Loading your gigs...</p>
          </div>
        </div>
      ) : gigs.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-orange-500 text-5xl mb-4">
            <FaPlus className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No gigs yet</h3>
          <p className="text-gray-500 mb-6">Start creating your first gig to showcase your services!</p>
          <Link href="/create-new">
            <button className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg transition-all duration-300 shadow-md font-medium">
              Create Your First Gig
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {gigs.map((gig) => (
            <div
              key={gig._id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
            >
              <div className="relative group">
                <img
                  src={gig.photos[0]}
                  alt={gig.title}
                  className="w-full h-52 object-cover transition-all duration-500"
                />
                <div className="absolute top-0 right-0 m-3"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent div from capturing the click
                      handleShare(gig._id);
                    }}
                    className="bg-white text-orange-500 p-2 rounded-full shadow-md hover:text-orange-600 hover:bg-gray-50 transition-colors duration-300"
                    title="Share Gig"
                  >
                    <FaShareAlt size={16} />
                  </button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 line-clamp-2">
                  {gig.title}
                </h3>

                <div className="mt-auto pt-4 flex justify-between gap-4">
                  <button
                    onClick={() => handleEdit(gig._id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                  >
                    <FaEdit size={14} />
                    <span className="font-medium text-sm">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(gig._id)}
                    disabled={deleteLoading === gig._id}
                    className={`flex-1 flex items-center justify-center gap-2 ${deleteLoading === gig._id
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                      } text-white px-4 py-2.5 rounded-lg transition-colors duration-300`}
                  >
                    {deleteLoading === gig._id ? (
                      <Loader2 className='h-6 w-6 animate-spin' />
                    ) : (
                      <FaTrashAlt size={14} />
                    )}
                    <span className="font-medium text-sm">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {gigs.length < 5 && (
            <Link href="/create-new">
              <div className="bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 transition-all duration-300 hover:shadow-md cursor-pointer h-full min-h-[280px]">
                <div className="text-orange-500 text-4xl mb-3 bg-orange-100 p-4 rounded-full">
                  <FaPlus />
                </div>
                <p className="text-gray-700 font-medium text-center">
                  Create New Gig
                </p>
                <p className="text-gray-500 text-sm text-center mt-2">
                  Showcase your services to potential clients
                </p>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Gigs;