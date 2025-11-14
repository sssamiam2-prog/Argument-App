import React from 'react';
import { MicVisualizer } from './MicVisualizer';

interface MicSelectionProps {
    devices: MediaDeviceInfo[];
    selectedDevice: string;
    onDeviceChange: (deviceId: string) => void;
    stream: MediaStream | null;
}

export const MicSelection: React.FC<MicSelectionProps> = ({
    devices,
    selectedDevice,
    onDeviceChange,
    stream,
}) => {
    return (
        <div className="max-w-md space-y-2">
             <label htmlFor="mic-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Microphone
            </label>
            <select
              id="mic-select"
              value={selectedDevice}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-sm"
              aria-label="Select microphone source"
            >
              {devices.length > 0 ? (
                devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${index + 1}`}
                  </option>
                ))
              ) : (
                <option>No microphones found</option>
              )}
            </select>
            <MicVisualizer stream={stream} />
        </div>
    );
}