import { Clock, Users, Star, BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    teacher: string;
    level: string;
    duration: string;
    students: number;
    rating: number;
    price: number;
    image?: string;
    videoUrl?: string;
  };
  onPurchase?: (course: any) => void;
  isEnrolled?: boolean;
  isPurchased?: boolean;
}

export function CourseCard({ course, onPurchase, isEnrolled, isPurchased }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
        {course.image && (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm">
          {course.level}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">
            {course.teacher.charAt(0)}
          </div>
          <span className="text-sm text-gray-700">{course.teacher}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          {/* <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.students}</span>
          </div> */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating}</span>
          </div>
        </div>

        {course.videoUrl && (
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
            <BookOpen className="w-4 h-4" />
            <span>Видео материал орсон</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <span className="text-2xl text-gray-900">{course.price.toLocaleString()}₮</span>
          </div>
          <button
            onClick={() => onPurchase?.(course)}
            disabled={isEnrolled || isPurchased}
            className={`px-4 py-2 rounded-lg transition ${
              isEnrolled || isPurchased
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEnrolled || isPurchased ? 'Худалдаж авсан' : 'Худалдаж авах'}
          </button>
        </div>
      </div>
    </div>
  );
}
