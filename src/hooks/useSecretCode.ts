import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '@/config/env';

const SECRET_CODE = `${env.pss} `; // Change this to your secret code/word
const TARGET_ROUTE = '/platform/login';

export const useSecretCode = (): void => {
  const [, setTypedKeys] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Get the active element to prevent triggering while typing in inputs/textareas
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      // Only accept single alphabetical or numerical keys
      if (key.length === 1) {
        setTypedKeys((prev) => {
          const nextKeys = (prev + key).slice(-SECRET_CODE.length);

          if (nextKeys === SECRET_CODE) {
            navigate(TARGET_ROUTE);
            return ''; // Reset after successful match
          }

          return nextKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
};
