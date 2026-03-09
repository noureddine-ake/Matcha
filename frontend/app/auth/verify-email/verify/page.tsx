import { Suspense } from 'react';
import VerifyContent from './VerifyContent';
import {Loader2} from 'lucide-react';


export default function VerifyEmailUpdatePage() {
  return (
    <div className="size-full flex items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-6xl relative z-10 space-y-8 flex flex-col md:flex-row justify-center items-center md:space-x-16">
        <Suspense fallback={
          <div className="flex items-center justify-center w-full">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}