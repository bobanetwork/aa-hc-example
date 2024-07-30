import { useStoryContext } from '@/context/StoryContext';
import { getStory, submitAction } from '@/util';
import { useState } from 'react';

const DialogueBubble = ({
  story,
  options,
  handleSubmitAction,
}: {
  story: string;
  options: string[];
  handleSubmitAction: any;
}) => {
  const optionSelect = (opt: string) => {
    handleSubmitAction(opt);
  };

  return (
    <>
      <div className="self-start w-6/12">
        {story && (
          <div className="bg-green-200 p-3 just rounded-md w-full">{story}</div>
        )}
      </div>
      <div className="grid grid-cols-2 self-end w-6/12 space-x-3">
        {options.map((opt) => (
          <button
            onClick={() => optionSelect(opt)}
            className="h-full bg-zinc-200 rounded-md p-2 transition-all duration-100 hover:bg-zinc-300 hover:-translate-y-1"
          >
            {opt}
          </button>
        ))}
      </div>
    </>
  );
};

export default function Dialogue() {
  const { story, setStory } = useStoryContext();
  const [actionResult, setActionResult] = useState(null);

  const handleGetStory = async () => {
    try {
      const resp = await getStory();
      setStory(resp);
    } catch (error) {
      console.error('Error calling getStory', error);
    }
  };

  const handleSubmitAction = async (action: string) => {
    try {
      const result = await submitAction(story.gameId, action);
      setActionResult(result);
      handleGetStory();
    } catch (error) {
      console.error('Error calling submitAction', error);
    }
  };

  return (
    <div
      className={`flex-grow flex justify-center w-full bg-gray-100 shadow-sm mx-auto py-32 px-10 overflow-y-auto ${
        !story.gameId && 'mb-20'
      }`}
    >
      <div className="flex gap-8 w-6/12 text-black">
        {story && (
          <DialogueBubble
            story={story.story}
            options={story.options}
            handleSubmitAction={handleSubmitAction}
          />
        )}
      </div>
    </div>
  );
}
