"use client";

import { Container } from "@/components/ui/container";
import { Image as ImageIcon } from "lucide-react";

export function PropertyGallery() {
  return (
    <section className="py-12 bg-white">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[400px] md:h-[600px]">
          {/* Main Large Image */}
          <div className="md:col-span-2 md:row-span-2 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden group">
            <div className="text-gray-300 text-center group-hover:scale-110 transition-transform duration-700">
               <ImageIcon className="w-20 h-20 mx-auto mb-4" />
               <p className="font-bold">Main Property View</p>
            </div>
          </div>
          {/* Smaller Thumbnails */}
          <div className="bg-primary-soft rounded-2xl flex items-center justify-center border border-gray-100">
             <ImageIcon className="w-8 h-8 text-primary/30" />
          </div>
          <div className="bg-primary-soft rounded-2xl flex items-center justify-center border border-gray-100">
             <ImageIcon className="w-8 h-8 text-primary/30" />
          </div>
          <div className="bg-primary-soft rounded-2xl flex items-center justify-center border border-gray-100">
             <ImageIcon className="w-8 h-8 text-primary/30" />
          </div>
          <div className="bg-primary-soft rounded-2xl flex items-center justify-center border border-gray-100">
             <ImageIcon className="w-8 h-8 text-primary/30" />
          </div>
        </div>
      </Container>
    </section>
  );
}
