import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Priority, ReminderPreset, Status, type Assignment } from '../../../types';
import EditAssignmentModal from '../../../components/EditAssignmentModal';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseApp = vi.fn();

vi.mock('../../../context', () => ({
  useApp: () => mockUseApp(),
}));

vi.mock('../../../components/ReminderSelector', () => ({
  ReminderSelector: ({ onChange }: { onChange: (reminder: unknown) => void }) => (
    <button
      data-testid="mock-reminder-selector"
      type="button"
      onClick={() => onChange({ enabled: true, preset: '1d' })}
    >
      reminder
    </button>
  ),
}));

vi.mock('../../../components/notes', () => ({
  NotesEditor: ({ onChange }: { onChange: (notes: unknown) => void }) => (
    <button
      data-testid="mock-notes-editor"
      type="button"
      onClick={() => onChange({ version: 1, blocks: [] })}
    >
      notes
    </button>
  ),
}));

describe('EditAssignmentModal', () => {
  const updateAssignment = vi.fn();
  const onClose = vi.fn();

  const assignment: Assignment = {
    id: 'assignment-1',
    title: 'Old Title',
    subjectId: 'subject-1',
    status: Status.Pending,
    dueDate: '2026-02-20T09:30:00.000Z',
    priority: Priority.Medium,
    createdAt: '2026-02-01T00:00:00.000Z',
    reminder: {
      enabled: true,
      preset: ReminderPreset.OneHour,
    },
  };

  beforeEach(() => {
    updateAssignment.mockReset();
    updateAssignment.mockResolvedValue(undefined);
    onClose.mockReset();

    mockUseApp.mockReturnValue({
      subjects: [{ id: 'subject-1', name: 'Math', color: 'bg-blue-500' }],
      updateAssignment,
    });
  });

  it('submits updated payload with combined due date/time', async () => {
    render(
      <EditAssignmentModal
        isOpen={true}
        onClose={onClose}
        assignment={assignment}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText('e.g., History Essay - Chapter 5 Analysis'),
      { target: { value: 'Updated Title' } }
    );

    fireEvent.change(screen.getByTestId('assignment-date-input'), {
      target: { value: '2026-02-22' },
    });
    fireEvent.change(screen.getByTestId('assignment-time-input'), {
      target: { value: '11:15' },
    });

    fireEvent.click(screen.getByTestId('mock-reminder-selector'));

    fireEvent.submit(
      screen.getByTestId('assignment-submit-button').closest('form')!
    );

    const expectedDueDate = new Date('2026-02-22T11:15').toISOString();

    await waitFor(() => {
      expect(updateAssignment).toHaveBeenCalledWith(
        'assignment-1',
        expect.objectContaining({
          title: 'Updated Title',
          subjectId: 'subject-1',
          status: Status.Pending,
          dueDate: expectedDueDate,
          priority: Priority.Medium,
          examType: null,
          reminder: {
            enabled: true,
            preset: '1d',
          },
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders nothing when assignment is null', () => {
    const { container } = render(
      <EditAssignmentModal isOpen={true} onClose={onClose} assignment={null} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
