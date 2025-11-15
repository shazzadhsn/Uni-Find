import bubtLogo from 'figma:asset/214c4e35fc9a4a250613608e16c49b5b475361e2.png';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  variant?: 'default' | 'compact';
  user?: {
    id: string;
    name: string;
    email: string;
    userType: 'student' | 'faculty';
    userId: string;
    phone: string;
  };
  admin?: {
    email: string;
  };
  onLogout?: () => void;
  onProfileClick?: () => void;
}

export function Header({ variant = 'default', user, admin, onLogout, onProfileClick }: HeaderProps) {
  const isAdmin = !!admin;
  const displayUser = user || admin;

  return (
    <div className={`${isAdmin ? 'bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 text-white' : 'bg-white dark:bg-gray-900 border-border'} border-b ${variant === 'compact' ? 'py-3' : 'py-4'} ${(user || admin) ? 'sticky top-0 z-10 shadow-sm' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={bubtLogo} 
              alt="BUBT Logo" 
              className={variant === 'compact' ? 'h-12' : 'h-16'}
            />
            <div>
              <h1 className={`${isAdmin ? 'text-white' : 'text-gray-900 dark:text-gray-100'} ${variant === 'compact' ? 'text-lg' : ''}`}>
                Bangladesh University of Business & Technology
              </h1>
              {variant !== 'compact' && (
                <p className={`text-sm ${isAdmin ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  UniFind - Lost & Found System {isAdmin && '(Admin Portal)'}
                </p>
              )}
            </div>
          </div>
          
          {displayUser && onLogout && (
            <div className="flex items-center gap-2">
              <ThemeToggle className={isAdmin ? 'text-white hover:bg-white/10' : ''} />
              <div 
                className={`hidden md:flex items-center gap-3 ${user && onProfileClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => user && onProfileClick && onProfileClick()}
              >
                <div className={`w-10 h-10 ${isAdmin ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900'} rounded-full flex items-center justify-center`}>
                  {isAdmin ? (
                    <ShieldCheck className="w-5 h-5 text-white" />
                  ) : (
                    <UserIcon className={`w-5 h-5 ${isAdmin ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  )}
                </div>
                <div className="text-right">
                  {user && <p className={`text-sm ${isAdmin ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{user.name}</p>}
                  {admin && <p className={`text-sm ${isAdmin ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>Admin</p>}
                  {user && <p className={`text-xs ${isAdmin ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'} capitalize`}>{user.userType}</p>}
                  {admin && <p className={`text-xs ${isAdmin ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>{admin.email}</p>}
                </div>
              </div>
              <Button
                onClick={onLogout}
                variant="ghost"
                size="sm"
                className={`gap-2 ${isAdmin ? 'text-white hover:bg-white/10' : ''}`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}