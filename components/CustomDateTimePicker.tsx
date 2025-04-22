import { useState } from "react";
import { motion } from "framer-motion";

export default function CreatePollPage() {
 
  
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  // Handle time change
  const handleTimeChange = (index: number, newTime: string) => {
    const updatedTimes = [...selectedTimes];
    updatedTimes[index] = newTime;
    setSelectedTimes(updatedTimes);
  };

  // Add another time
  const addAnotherTime = () => {
    setSelectedTimes([...selectedTimes, ""]);
  };

  // Remove a time
  const removeTime = (index: number) => {
    const updatedTimes = selectedTimes.filter((_, i) => i !== index);
    setSelectedTimes(updatedTimes);
  };

  return (
    <div>
      {/* Time Section */}
      {selectedTimes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h2 className="font-semibold text-gray-700 mt-8 mb-2">Select Times</h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {selectedTimes.map((time, index) => {
              const current = time ? new Date(time) : new Date();
              const dateStr = current.toISOString().slice(0, 10); // YYYY-MM-DD
              const timeStr = current.toISOString().slice(11, 16); // HH:MM

              return (
                <div key={index} className="flex flex-wrap items-center gap-3">
                  {/* Custom Date Input */}
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split("-");
                      const updated = new Date(time || new Date());
                      updated.setFullYear(Number(year));
                      updated.setMonth(Number(month) - 1);
                      updated.setDate(Number(day));
                      handleTimeChange(index, updated.toISOString());
                    }}
                    placeholder="YYYY-MM-DD"
                    className="p-3 w-[160px] border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
                  />

                  {/* Custom Time Input */}
                  <input
                    type="text"
                    value={timeStr}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":");
                      const updated = new Date(time || new Date());
                      updated.setHours(Number(hours));
                      updated.setMinutes(Number(minutes));
                      updated.setSeconds(0);
                      updated.setMilliseconds(0);
                      handleTimeChange(index, updated.toISOString());
                    }}
                    placeholder="HH:MM"
                    className="p-3 w-[120px] border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
                  />

                  {/* Delete Button */}
                 {/* Delete Button */}
<button
  type="button"
  onClick={() => removeTime(index)}
  className="text-red-500 hover:text-white border border-red-200 hover:bg-red-500 transition-all duration-200 px-3 py-1 rounded-full font-semibold text-sm shadow-sm"
>
  Delete
</button>


                  {/* Add Button */}
                  {index === selectedTimes.length - 1 && (
                    <button
                      type="button"
                      onClick={addAnotherTime}
                      className="bg-emerald-400 hover:bg-emerald-500 text-white text-sm font-medium py-2 px-3 rounded-xl shadow-sm"
                    >
                      + Add New Time
                    </button>
                  )}
                </div>
              );
            })}

            {/* Initial Add Time Button */}
            {selectedTimes.length === 0 && (
              <button
                type="button"
                onClick={addAnotherTime}
                className="bg-emerald-400 hover:bg-emerald-500 text-white text-sm font-medium py-2 px-4 rounded-xl shadow-sm"
              >
                + Add Time
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
