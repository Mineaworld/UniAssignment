import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Priority, Status } from '../../../types';
import CreateAssignmentModal from '../../../components/CreateAssignmentModal';
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
      onClick={() => onChange({ enabled: true, preset: '1h' })}
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

describe('CreateAssignmentModal', () => {
  const addAssignment = vi.fn();
  const addSubject = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    addAssignment.mockReset();
    addAssignment.mockResolvedValue(undefined);
    addSubject.mockReset();
    onClose.mockReset();

    mockUseApp.mockReturnValue({
      subjects: [{ id: 'subject-1', name: 'Math', color: 'bg-blue-500' }],
      addAssignment,
      addSubject,
    });
  });

  it('does not submit when required fields are missing', async () => {
    render(<CreateAssignmentModal isOpen={true} onClose={onClose} />);

    const form = screen
      .getByTestId('assignment-submit-button')
      .closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(addAssignment).not.toHaveBeenCalled();
    });
  });

  it('submits assignment payload with combined due date/time and reminder', async () => {
    render(<CreateAssignmentModal isOpen={true} onClose={onClose} />);

    fireEvent.change(
      screen.getByPlaceholderText('e.g., History Essay - Chapter 5 Analysis'),
      { target: { value: 'Physics Homework' } }
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0]!, { target: { value: 'subject-1' } });
    fireEvent.change(selects[1]!, { target: { value: Status.InProgress } });

    fireEvent.change(screen.getByTestId('assignment-date-input'), {
      target: { value: '2026-02-20' },
    });
    fireEvent.change(screen.getByTestId('assignment-time-input'), {
      target: { value: '09:30' },
    });

    fireEvent.click(screen.getByTestId('mock-reminder-selector'));
    fireEvent.submit(
      screen.getByTestId('assignment-submit-button').closest('form')!
    );

    const expectedDueDate = new Date('2026-02-20T09:30').toISOString();

    await waitFor(() => {
      expect(addAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Physics Homework',
          subjectId: 'subject-1',
          status: Status.InProgress,
          dueDate: expectedDueDate,
          priority: Priority.Medium,
          examType: null,
          reminder: {
            enabled: true,
            preset: '1h',
          },
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
