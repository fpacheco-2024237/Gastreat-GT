export const Spinner = ({ small }) => {
  const size = small ? 'h-5 w-5 border-2' : 'h-16 w-16 border-4';
  const container = small ? 'inline-flex' : 'w-full h-screen items-center justify-center';

  return (
    <div className={`flex justify-center ${container}`}>
      <div className={`animate-spin rounded-full ${size} border-blue-500 border-t-transparent`}></div>
    </div>
  );
};
