import * as Ajax from 'core/ajax';
import * as Str from 'core/str';
import * as Notification from 'core/notification';

const STATE = {
    courseId: 0,
    courseName: '',
    teacherUserId: 0,
    alertType: '',
    selectedStudents: new Map(),
    studentDataById: new Map(),
    page: 1,
    perPage: 10,
    totalPages: 1,
    totalStudents: 0,
    rangeStart: 0,
    rangeEnd: 0,
    condition: 'below',
    thresholdId: 7,
    filterMode: 'course',
    gradeItemId: 0,
    gradeItemIds: [],
    includeAllStudents: false,
    gradeItemsLoadedForCourse: 0,
    previewData: null,
    sortBy: 'name',
    sortDir: 'none',
    composeTemplates: [],
    composeTemplateId: '',
};

const SELECTORS = {
    dashboardView: '#earlyalert-dashboard-view',
    workflowView: '#earlyalert-workflow-view',
    courseRow: '[data-action="earlyalert/select-course"]',
    openCourse: '[data-action="earlyalert/open-course"]',
    backDashboard: '[data-action="earlyalert/back-dashboard"]',
    backStep1: '[data-action="earlyalert/back-step-1"]',
    backStep2: '[data-action="earlyalert/back-step-2"]',
    goStep2: '[data-action="earlyalert/go-step-2"]',
    goStep3: '[data-action="earlyalert/go-step-3"]',
    applyFilters: '[data-action="earlyalert/apply-filters"]',
    sendAlerts: '[data-action="earlyalert/send-alerts"]',
    search: '[data-action="earlyalert/search"]',
    prevPage: '[data-action="earlyalert/prev-page"]',
    nextPage: '[data-action="earlyalert/next-page"]',
    goPage: '[data-action="earlyalert/go-page"]',
    closePreview: '[data-action="earlyalert/close-preview"]',
    clearSelection: '[data-action="earlyalert/clear-selection"]',
    exportSelected: '[data-action="earlyalert/export-selected"]',
    sort: '[data-action="earlyalert/sort"]',
    resetTemplate: '[data-action="earlyalert/reset-template"]',
    alertOption: '.ea-alert-option',
    gradeItems: '#ea-grade-items',
};

const STRINGS = {};
const TOKEN_LIST = ['[Student Name]', '[Course Name]', '[Grade Item]', '[Assignment Name]', '[Instructor Name]'];
const SORT_ICON = {
    none: '-',
    asc: '↑',
    desc: '↓',
};

const loadStrings = async() => {
    const keys = [
        'selected',
        'loading',
        'no_students_found',
        'preview_email',
        'send_email',
        'send_dialog_text',
        'send',
        'cancel',
        'alert_sent_successfully',
        'preview_message_placeholder',
        'overall_course_grade',
        'clear_selection',
        'export_csv',
        'message_template',
        'subject_line',
        'message_body',
        'available_tokens',
        'sample_preview_note',
        'reset_to_template',
        'student_id',
    ];
    const values = await Promise.all(keys.map(key => Str.get_string(key, 'local_earlyalert').catch(() => key)));
    keys.forEach((key, index) => {
        STRINGS[key] = values[index];
    });
};

const root = () => document.getElementById('earlyalert-dashboard');

let previewModalInstance = null;

const escapeHtml = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const decodeHtml = value => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value || '';
    return textarea.value;
};

const sanitizeHtml = html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script,iframe,object,embed,form,style').forEach(node => node.remove());

    doc.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = (attr.value || '').trim().toLowerCase();
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
            if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return doc.body.innerHTML;
};

const renderMessageHtml = (target, message) => {
    if (!target) {
        return;
    }

    if (!message) {
        target.textContent = STRINGS.preview_message_placeholder || '';
        return;
    }

    const decoded = decodeHtml(message);
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(decoded);
    if (!hasHtml) {
        target.innerHTML = escapeHtml(decoded).replace(/\n/g, '<br>');
        return;
    }

    target.innerHTML = sanitizeHtml(decoded);
};

const parseGradePercent = gradeText => {
    const match = String(gradeText || '').match(/([0-9]+(?:\.[0-9]+)?)%/);
    if (!match) {
        return Number.NaN;
    }
    return parseFloat(match[1]);
};

const compareValues = (left, right) => {
    if (left < right) {
        return -1;
    }
    if (left > right) {
        return 1;
    }
    return 0;
};

const getStudentSortValue = (student, sortBy) => {
    if (sortBy === 'idnumber') {
        return String(student.idnumber || '').toLowerCase();
    }
    if (sortBy === 'grade') {
        const percent = parseGradePercent(student.grade || '');
        return Number.isNaN(percent) ? Number.NEGATIVE_INFINITY : percent;
    }
    return `${String(student.last_name || '').toLowerCase()} ${String(student.first_name || '').toLowerCase()}`;
};

const sortStudents = students => {
    if (!Array.isArray(students) || STATE.sortDir === 'none') {
        return students || [];
    }

    const multiplier = STATE.sortDir === 'asc' ? 1 : -1;
    return [...students].sort((a, b) => {
        const av = getStudentSortValue(a, STATE.sortBy);
        const bv = getStudentSortValue(b, STATE.sortBy);
        const result = compareValues(av, bv);
        if (result !== 0) {
            return result * multiplier;
        }
        const fallbackA = `${String(a.last_name || '').toLowerCase()} ${String(a.first_name || '').toLowerCase()}`;
        const fallbackB = `${String(b.last_name || '').toLowerCase()} ${String(b.first_name || '').toLowerCase()}`;
        return compareValues(fallbackA, fallbackB);
    });
};

const updateSortIndicators = () => {
    ['name', 'idnumber', 'grade'].forEach(key => {
        const node = document.getElementById(`ea-sort-indicator-${key}`);
        if (!node) {
            return;
        }
        if (STATE.sortBy === key) {
            node.textContent = SORT_ICON[STATE.sortDir] || SORT_ICON.none;
        } else {
            node.textContent = SORT_ICON.none;
        }
    });
};

const getPreviewModal = () => {
    const modalEl = document.getElementById('ea-preview-modal');
    if (!modalEl) {
        return null;
    }

    if (!previewModalInstance && window.bootstrap && window.bootstrap.Modal) {
        previewModalInstance = new window.bootstrap.Modal(modalEl);
    }
    return {modalEl, instance: previewModalInstance};
};

const openPreviewModal = () => {
    const modal = getPreviewModal();
    if (!modal) {
        return;
    }

    if (modal.instance) {
        modal.instance.show();
    } else {
        modal.modalEl.classList.add('show');
        modal.modalEl.style.display = 'block';
    }
};

const closePreviewModal = () => {
    const modal = getPreviewModal();
    if (!modal) {
        return;
    }

    if (modal.instance) {
        modal.instance.hide();
    } else {
        modal.modalEl.classList.remove('show');
        modal.modalEl.style.display = 'none';
    }
};

const showDashboard = () => {
    document.querySelector(SELECTORS.dashboardView)?.classList.remove('d-none');
    document.querySelector(SELECTORS.workflowView)?.classList.add('d-none');
};

const showWorkflow = () => {
    document.querySelector(SELECTORS.dashboardView)?.classList.add('d-none');
    document.querySelector(SELECTORS.workflowView)?.classList.remove('d-none');
};

const updateSelectionState = () => {
    const count = STATE.selectedStudents.size;
    const selectedCount = document.getElementById('ea-selected-count');
    if (selectedCount) {
        selectedCount.textContent = `${count} ${STRINGS.selected || 'selected'}`;
    }

    const toCompose = document.querySelector(SELECTORS.goStep3);
    if (toCompose) {
        toCompose.disabled = count === 0;
    }
};

const updateRangeIndicator = (page, perPage, total) => {
    const rangeEl = document.getElementById('ea-table-range');
    if (!rangeEl) {
        return;
    }
    if (!total) {
        rangeEl.textContent = 'Showing 0-0 of 0';
        return;
    }
    const start = ((page - 1) * perPage) + 1;
    const end = Math.min(page * perPage, total);
    STATE.rangeStart = start;
    STATE.rangeEnd = end;
    STATE.totalStudents = total;
    rangeEl.textContent = `Showing ${start}-${end} of ${total}`;
};

const setLoadingRows = () => {
    const tbody = document.querySelector('[data-region="students-table-body"]');
    if (!tbody) {
        return;
    }
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${escapeHtml(STRINGS.loading || 'Loading...')}</td></tr>`;
};

const deriveFilterModeFromSelection = () => {
    const select = document.querySelector(SELECTORS.gradeItems);
    if (!select) {
        STATE.filterMode = 'course';
        STATE.gradeItemId = 0;
        STATE.gradeItemIds = [];
        return;
    }

    const selected = Array.from(select.selectedOptions)
        .map(option => parseInt(option.value || '0', 10))
        .filter(value => !Number.isNaN(value));

    if (!selected.length || selected.includes(0)) {
        STATE.filterMode = 'course';
        STATE.gradeItemId = 0;
        STATE.gradeItemIds = [];
        return;
    }

    if (selected.length === 1) {
        STATE.filterMode = 'single';
        STATE.gradeItemId = selected[0];
        STATE.gradeItemIds = [];
        return;
    }

    STATE.filterMode = 'multi';
    STATE.gradeItemId = 0;
    STATE.gradeItemIds = selected;
};

const updatePaginationUi = response => {
    STATE.totalPages = Math.max(1, Math.ceil((response.total || 0) / (response.perpage || STATE.perPage)));

    const summary = document.getElementById('ea-pagination-summary');
    if (summary) {
        summary.textContent = `${response.total} total`;
    }

    updateRangeIndicator(response.page || 1, response.perpage || STATE.perPage, response.total || 0);

    const totalPagesLabel = document.getElementById('ea-total-pages');
    if (totalPagesLabel) {
        totalPagesLabel.textContent = `of ${STATE.totalPages}`;
    }

    const pageInput = document.getElementById('ea-page-input');
    if (pageInput) {
        pageInput.value = String(response.page || 1);
        pageInput.max = String(STATE.totalPages);
    }

    const prev = document.querySelector(SELECTORS.prevPage);
    const next = document.querySelector(SELECTORS.nextPage);
    if (prev) {
        prev.disabled = response.page <= 1;
    }
    if (next) {
        next.disabled = response.page >= STATE.totalPages;
    }
};

const loadGradeItems = () => {
    if (!STATE.courseId || STATE.gradeItemsLoadedForCourse === STATE.courseId) {
        return Promise.resolve();
    }

    const select = document.querySelector(SELECTORS.gradeItems);
    if (!select) {
        return Promise.resolve();
    }

    return Ajax.call([{
        methodname: 'local_earlyalert_get_course_grade_items',
        args: {courseid: STATE.courseId}
    }])[0].then(items => {
        const optionHtml = [];
        optionHtml.push(`<option value="0" selected>${escapeHtml(STRINGS.overall_course_grade || 'Overall Course Grade')}</option>`);
        (items || []).forEach(item => {
            if (parseInt(item.id, 10) !== 0 && item.itemtype !== 'course') {
                optionHtml.push(`<option value="${parseInt(item.id, 10)}">${escapeHtml(item.name || '')}</option>`);
            }
        });
        select.innerHTML = optionHtml.join('');
        STATE.gradeItemsLoadedForCourse = STATE.courseId;
        deriveFilterModeFromSelection();
    }).catch(Notification.exception);
};

const loadStudents = () => {
    if (!STATE.courseId || !STATE.alertType) {
        return;
    }

    deriveFilterModeFromSelection();
    setLoadingRows();

    const search = document.getElementById('ea-search')?.value || '';

    Ajax.call([{methodname: 'local_earlyalert_get_course_students_page', args: {
        courseid: STATE.courseId,
        teacher_user_id: STATE.teacherUserId,
        alert_type: STATE.alertType,
        filtermode: STATE.filterMode,
        condition: STATE.condition,
        thresholdid: STATE.thresholdId,
        gradeitemid: STATE.gradeItemId,
        gradeitemids: JSON.stringify(STATE.gradeItemIds),
        includeallstudents: STATE.includeAllStudents,
        search,
        page: STATE.page,
        perpage: STATE.perPage,
        sortby: STATE.sortBy,
        sortdir: STATE.sortDir,
    }}])[0].then(response => {
        const tbody = document.querySelector('[data-region="students-table-body"]');
        if (!tbody) {
            return;
        }

        if (!response.students || !response.students.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${escapeHtml(STRINGS.no_students_found || 'No students found')}</td></tr>`;
            updatePaginationUi(response);
            return;
        }

        const students = sortStudents(response.students);

        tbody.innerHTML = students.map(student => {
            STATE.studentDataById.set(student.id, student);
            const checked = STATE.selectedStudents.has(student.id) ? 'checked' : '';
            const fullname = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
            const email = student.email ? `<div class="small text-muted">${escapeHtml(student.email)}</div>` : '';
            return `
                <tr>
                    <td><input type="checkbox" class="form-check-input ea-student-checkbox" data-student-id="${student.id}" ${checked}></td>
                    <td>
                        <div class="fw-semibold">${escapeHtml(fullname)}</div>
                        ${email}
                    </td>
                    <td>${escapeHtml(student.idnumber || '')}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(student.grade || '')}</span></td>
                    <td class="text-end"><button type="button" class="btn btn-outline-secondary btn-sm ea-student-preview" data-student-id="${student.id}">${escapeHtml(STRINGS.preview_email || 'Preview')}</button></td>
                </tr>`;
        }).join('');

        updatePaginationUi(response);
        updateSelectionState();
        updateSortIndicators();
    }).catch(Notification.exception);
};

const getTemplateDefaultsForAlertType = alertType => {
    const tokenStudent = '[Student Name]';
    const tokenCourse = '[Course Name]';
    const tokenGradeItem = '[Grade Item]';
    const tokenAssignment = '[Assignment Name]';
    const tokenInstructor = '[Instructor Name]';

    if (alertType === 'assign') {
        return [{
            id: 'default-assignment',
            name: 'Default - Missed Assignment',
            subject: `Check-in regarding ${tokenCourse}`,
            body: `Dear ${tokenStudent},\n\nI am reaching out because you missed ${tokenAssignment} in ${tokenCourse}. Please connect with me so we can plan your next steps.\n\nBest regards,\n${tokenInstructor}`,
        }];
    }

    if (alertType === 'exam') {
        return [{
            id: 'default-exam',
            name: 'Default - Missed Test/Quiz',
            subject: `Follow-up for ${tokenCourse}`,
            body: `Dear ${tokenStudent},\n\nI noticed a missed test/quiz in ${tokenCourse}. Please reach out so we can discuss support options and your plan going forward.\n\nBest regards,\n${tokenInstructor}`,
        }];
    }

    if (alertType === 'commendation') {
        return [{
            id: 'default-commendation',
            name: 'Default - Commendation',
            subject: `Great progress in ${tokenCourse}`,
            body: `Dear ${tokenStudent},\n\nI want to acknowledge your strong progress in ${tokenCourse}. Keep up the excellent work.\n\nBest regards,\n${tokenInstructor}`,
        }];
    }

    return [{
        id: 'default-grade',
        name: 'Default - Low Grade Alert',
        subject: `Check-in regarding ${tokenCourse}`,
        body: `Dear ${tokenStudent},\n\nI am reaching out because your current grade in ${tokenCourse} (${tokenGradeItem}) is below the expected threshold.\n\nPlease do not hesitate to reply if you have any questions.\n\nBest regards,\n${tokenInstructor}`,
    }];
};

const renderTokenList = () => {
    const container = document.getElementById('ea-token-list');
    if (!container) {
        return;
    }

    container.innerHTML = TOKEN_LIST
        .map(token => `<span class="badge bg-white border text-dark">${escapeHtml(token)}</span>`)
        .join('');
};

const getSampleStudent = () => ({
    first_name: 'Alex',
    last_name: 'Johnson',
});

const getPlaceholderMap = student => {
    const fullname = student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'Student Name';
    return {
        '[Student Name]': fullname || 'Student Name',
        '[Course Name]': STATE.courseName || 'Course Name',
        '[Grade Item]': STRINGS.overall_course_grade || 'Overall Course Grade',
        '[Assignment Name]': 'Assignment Name',
        '[Instructor Name]': 'Instructor',
    };
};

const applyPlaceholders = (text, map) => {
    let output = String(text || '');
    Object.entries(map).forEach(([token, value]) => {
        output = output.split(token).join(value);
    });
    return output;
};

const updateComposeSummary = () => {
    const summary = document.getElementById('ea-compose-summary');
    if (!summary) {
        return;
    }

    const count = STATE.selectedStudents.size;
    summary.textContent = `Sending to ${count} students. Personalization tokens are filled automatically when sent.`;
};

const renderComposePreview = () => {
    const subjectNode = document.getElementById('ea-message-preview-subject');
    const bodyNode = document.getElementById('ea-message-preview-text');
    if (!subjectNode || !bodyNode) {
        return;
    }

    const sampleStudent = getSampleStudent();
    const map = getPlaceholderMap(sampleStudent);

    const subjectInput = document.getElementById('ea-message-subject');
    const messageInput = document.getElementById('ea-custom-message');
    const subject = applyPlaceholders(subjectInput?.value || '', map);
    const body = applyPlaceholders(messageInput?.value || '', map);

    subjectNode.textContent = subject;
    renderMessageHtml(bodyNode, body);
};

const applyTemplate = templateId => {
    const template = STATE.composeTemplates.find(item => item.id === templateId) || STATE.composeTemplates[0];
    if (!template) {
        return;
    }

    STATE.composeTemplateId = template.id;
    const subjectInput = document.getElementById('ea-message-subject');
    const messageInput = document.getElementById('ea-custom-message');
    if (subjectInput) {
        subjectInput.value = template.subject;
    }
    if (messageInput) {
        messageInput.value = template.body;
    }
    renderComposePreview();
};

const initComposeForm = () => {
    STATE.composeTemplates = getTemplateDefaultsForAlertType(STATE.alertType);

    const select = document.getElementById('ea-template-select');
    if (select) {
        select.innerHTML = STATE.composeTemplates.map(template =>
            `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`
        ).join('');
        STATE.composeTemplateId = STATE.composeTemplates[0]?.id || '';
        if (STATE.composeTemplateId) {
            select.value = STATE.composeTemplateId;
        }
    }

    renderTokenList();
    applyTemplate(STATE.composeTemplateId);
    updateComposeSummary();
};

const updatePreview = () => {
    renderComposePreview();
};

const previewStudent = studentid => {
    const customMessage = document.getElementById('ea-custom-message')?.value || '';
    Ajax.call([{methodname: 'local_earlyalert_get_student_preview_template', args: {
        courseid: STATE.courseId,
        teacher_user_id: STATE.teacherUserId,
        studentid,
        alert_type: STATE.alertType,
        thresholdid: STATE.thresholdId,
        assignment_title: '',
        custom_message: customMessage,
    }}])[0].then(response => {
        STATE.previewData = response;
        const student = STATE.studentDataById.get(studentid) || {};
        const recipient = document.getElementById('ea-preview-modal-recipient');
        if (recipient) {
            recipient.textContent = `${student.first_name || ''} ${student.last_name || ''}`.trim();
        }

        const modalBody = document.getElementById('ea-preview-modal-body');
        renderMessageHtml(modalBody, response.message || '');
        openPreviewModal();
    }).catch(Notification.exception);
};

const exportSelectedStudents = () => {
    const selectedIds = Array.from(STATE.selectedStudents.keys());
    if (!selectedIds.length) {
        Notification.alert('', STRINGS.no_students_found || 'No students selected');
        return;
    }

    const rows = selectedIds
        .map(id => STATE.studentDataById.get(id))
        .filter(Boolean);

    if (!rows.length) {
        Notification.alert('', STRINGS.no_students_found || 'No students selected');
        return;
    }

    const toCsv = value => {
        const raw = String(value || '');
        return `"${raw.replace(/"/g, '""')}"`;
    };

    const header = ['Student Name', 'Email', STRINGS.student_id || 'Student ID', 'Grade'];
    const lines = [header.map(toCsv).join(',')];

    rows.forEach(student => {
        const fullname = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
        lines.push([
            toCsv(fullname),
            toCsv(student.email || ''),
            toCsv(student.idnumber || ''),
            toCsv(student.grade || ''),
        ].join(','));
    });

    const blob = new Blob([`${lines.join('\n')}\n`], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `early-alert-selected-${STATE.courseId}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

const clearSelection = () => {
    STATE.selectedStudents.clear();
    document.querySelectorAll('.ea-student-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    const checkAll = document.getElementById('ea-check-all-page');
    if (checkAll) {
        checkAll.checked = false;
    }

    updateSelectionState();
    updateComposeSummary();
};

const sendAlerts = () => {
    const ids = Array.from(STATE.selectedStudents.keys());
    if (!ids.length) {
        Notification.alert('', STRINGS.no_students_found || 'No students selected');
        return;
    }

    Notification.confirm(
        STRINGS.send_email || 'Send Email',
        STRINGS.send_dialog_text || 'Are you sure you want to send the alert emails?',
        STRINGS.send || 'Send',
        STRINGS.cancel || 'Cancel',
        () => {
            Ajax.call([{methodname: 'local_earlyalert_report_log_insert', args: {
                template_data: JSON.stringify(ids.map(studentid => {
                    const student = STATE.studentDataById.get(studentid) || {};
                    return {
                        student_id: studentid,
                        template_id: student.templateid || 0,
                        revision_id: student.revision_id || 0,
                        triggered_from_user_id: student.triggered_from_user_id || STATE.teacherUserId,
                        course_id: STATE.courseId,
                        instructor_id: student.instructor_id || STATE.teacherUserId,
                        assignment_name: '',
                        trigger_grade: STATE.thresholdId,
                        actual_grade: student.grade || '',
                        custom_message: document.getElementById('ea-custom-message')?.value || '',
                    };
                })),
            }}])[0].then(() => {
                Notification.alert('', STRINGS.alert_sent_successfully || 'Alert sent successfully');
            }).catch(Notification.exception);
        }
    );
};

const showStep = step => {
    document.querySelectorAll('[data-region^="step-"]').forEach(region => region.classList.add('d-none'));
    document.querySelector(`[data-region="step-${step}"]`)?.classList.remove('d-none');

    document.querySelectorAll('.ea-step-label').forEach(stepNode => {
        const badgeEl = stepNode.previousElementSibling;
        if (!badgeEl || !badgeEl.classList.contains('badge')) {
            return;
        }
        const stepNum = parseInt(badgeEl.dataset.step || '0', 10);
        if (stepNum === step) {
            badgeEl.classList.remove('bg-secondary');
            badgeEl.classList.add('bg-primary');
            stepNode.classList.add('fw-semibold');
        } else if (stepNum < step) {
            badgeEl.classList.add('bg-success');
            badgeEl.classList.remove('bg-primary', 'bg-secondary');
            stepNode.classList.remove('fw-semibold');
        } else {
            badgeEl.classList.add('bg-secondary');
            badgeEl.classList.remove('bg-primary', 'bg-success');
            stepNode.classList.remove('fw-semibold');
        }
    });

    if (step === 2) {
        loadGradeItems().then(() => {
            loadStudents();
        }).catch(Notification.exception);
    }
    if (step === 3) {
        initComposeForm();
        updatePreview();
    }
};

const openCourseFlow = (courseId, courseName) => {
    STATE.courseId = parseInt(courseId || '0', 10);
    STATE.courseName = courseName || '';
    STATE.alertType = '';
    STATE.selectedStudents.clear();
    STATE.studentDataById.clear();
    STATE.previewData = null;
    STATE.page = 1;
    STATE.totalPages = 1;
    STATE.perPage = 10;
    STATE.includeAllStudents = false;
    STATE.filterMode = 'course';
    STATE.gradeItemId = 0;
    STATE.gradeItemIds = [];
    STATE.gradeItemsLoadedForCourse = 0;
    STATE.sortBy = 'name';
    STATE.sortDir = 'none';

    document.getElementById('ea-selected-course-label').textContent = STATE.courseName;
    document.querySelectorAll(SELECTORS.alertOption).forEach(button => button.classList.remove('active'));

    const next = document.querySelector(SELECTORS.goStep2);
    if (next) {
        next.disabled = true;
    }
    const toCompose = document.querySelector(SELECTORS.goStep3);
    if (toCompose) {
        toCompose.disabled = true;
    }

    const perPageSelect = document.getElementById('ea-per-page');
    if (perPageSelect) {
        perPageSelect.value = '10';
    }
    const includeAll = document.getElementById('ea-include-all-students');
    if (includeAll) {
        includeAll.checked = false;
    }

    updateSortIndicators();
    showWorkflow();
    showStep(1);
};

const updateNextStepButton = () => {
    const next = document.querySelector(SELECTORS.goStep2);
    if (next) {
        next.disabled = !STATE.alertType;
    }
};

const cycleSort = column => {
    if (STATE.sortBy !== column) {
        STATE.sortBy = column;
        STATE.sortDir = 'asc';
        return;
    }

    if (STATE.sortDir === 'none') {
        STATE.sortDir = 'asc';
        return;
    }
    if (STATE.sortDir === 'asc') {
        STATE.sortDir = 'desc';
        return;
    }

    STATE.sortDir = 'none';
};

export const init = async() => {
    await loadStrings();
    const dashboard = root();
    if (!dashboard) {
        return;
    }

    STATE.teacherUserId = parseInt(dashboard.dataset.teacherUserId || '0', 10);

    document.addEventListener('click', event => {
        const courseRow = event.target.closest(SELECTORS.courseRow);
        if (courseRow || event.target.closest(SELECTORS.openCourse)) {
            const row = courseRow || event.target.closest(SELECTORS.openCourse)?.closest(SELECTORS.courseRow);
            if (row) {
                openCourseFlow(row.dataset.courseId, row.dataset.courseName);
            }
            return;
        }

        if (event.target.closest(SELECTORS.backDashboard)) {
            showDashboard();
            return;
        }

        if (event.target.closest(SELECTORS.backStep1)) {
            showStep(1);
            return;
        }

        if (event.target.closest(SELECTORS.backStep2)) {
            showStep(2);
            return;
        }

        if (event.target.closest(SELECTORS.closePreview)) {
            closePreviewModal();
            return;
        }

        const sortButton = event.target.closest(SELECTORS.sort);
        if (sortButton) {
            const sortBy = sortButton.dataset.sortBy || 'name';
            cycleSort(sortBy);
            loadStudents();
            return;
        }

        if (event.target.closest(SELECTORS.clearSelection)) {
            clearSelection();
            return;
        }

        if (event.target.closest(SELECTORS.exportSelected)) {
            exportSelectedStudents();
            return;
        }

        if (event.target.closest(SELECTORS.alertOption)) {
            const button = event.target.closest(SELECTORS.alertOption);
            STATE.alertType = button.dataset.alertType || '';

            if (STATE.alertType === 'assign' || STATE.alertType === 'exam') {
                STATE.condition = 'missing';
            } else if (STATE.alertType === 'commendation') {
                STATE.condition = 'above';
            } else {
                STATE.condition = 'below';
            }

            const conditionSelect = document.getElementById('ea-condition');
            if (conditionSelect) {
                conditionSelect.value = STATE.condition;
            }

            document.querySelectorAll(SELECTORS.alertOption).forEach(option => option.classList.remove('active'));
            button.classList.add('active');
            updateNextStepButton();
            return;
        }

        if (event.target.closest(SELECTORS.goStep2)) {
            if (STATE.alertType) {
                showStep(2);
            }
            return;
        }

        if (event.target.closest(SELECTORS.goStep3)) {
            showStep(3);
            return;
        }

        if (event.target.closest(SELECTORS.applyFilters)) {
            STATE.page = 1;
            loadStudents();
            return;
        }

        if (event.target.closest(SELECTORS.search)) {
            STATE.page = 1;
            loadStudents();
            return;
        }

        if (event.target.closest(SELECTORS.prevPage)) {
            if (STATE.page > 1) {
                STATE.page--;
                loadStudents();
            }
            return;
        }

        if (event.target.closest(SELECTORS.nextPage)) {
            if (STATE.page < STATE.totalPages) {
                STATE.page++;
                loadStudents();
            }
            return;
        }

        if (event.target.closest(SELECTORS.goPage)) {
            const pageInput = document.getElementById('ea-page-input');
            if (pageInput) {
                const requested = parseInt(pageInput.value || '1', 10);
                STATE.page = Math.max(1, Math.min(STATE.totalPages, requested || 1));
                loadStudents();
            }
            return;
        }

        if (event.target.matches('.ea-student-preview')) {
            previewStudent(parseInt(event.target.dataset.studentId || '0', 10));
            return;
        }

        if (event.target.matches('.ea-student-checkbox')) {
            const studentId = parseInt(event.target.dataset.studentId || '0', 10);
            if (event.target.checked) {
                STATE.selectedStudents.set(studentId, true);
            } else {
                STATE.selectedStudents.delete(studentId);
            }
            updateSelectionState();
            updateComposeSummary();
            return;
        }

        if (event.target.closest(SELECTORS.resetTemplate)) {
            applyTemplate(STATE.composeTemplateId);
            return;
        }

        if (event.target.closest(SELECTORS.sendAlerts)) {
            sendAlerts();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.target.id === 'ea-search' && event.key === 'Enter') {
            event.preventDefault();
            STATE.page = 1;
            loadStudents();
        }
    });

    document.addEventListener('input', event => {
        if (event.target.id === 'ea-custom-message' || event.target.id === 'ea-message-subject') {
            updatePreview();
        }
    });

    const updateThresholdVisibility = () => {
        const thresholdWrap = document.getElementById('ea-threshold-wrap');
        if (!thresholdWrap) {
            return;
        }
        if (STATE.condition === 'missing') {
            thresholdWrap.style.display = 'none';
        } else {
            thresholdWrap.style.display = 'block';
        }
    };

    document.addEventListener('change', event => {
        if (event.target.id === 'ea-grade-threshold') {
            STATE.thresholdId = parseInt(event.target.value || '7', 10);
        }
        if (event.target.id === 'ea-condition') {
            STATE.condition = event.target.value;
            updateThresholdVisibility();
        }
        if (event.target.id === 'ea-grade-items') {
            deriveFilterModeFromSelection();
        }
        if (event.target.id === 'ea-include-all-students') {
            STATE.includeAllStudents = !!event.target.checked;
        }
        if (event.target.id === 'ea-per-page') {
            STATE.perPage = parseInt(event.target.value || '10', 10);
            STATE.page = 1;
            loadStudents();
        }
        if (event.target.id === 'ea-check-all-page') {
            document.querySelectorAll('.ea-student-checkbox').forEach(checkbox => {
                checkbox.checked = event.target.checked;
                const studentId = parseInt(checkbox.dataset.studentId || '0', 10);
                if (event.target.checked) {
                    STATE.selectedStudents.set(studentId, true);
                } else {
                    STATE.selectedStudents.delete(studentId);
                }
            });
            updateSelectionState();
            updateComposeSummary();
        }
        if (event.target.id === 'ea-template-select') {
            STATE.composeTemplateId = event.target.value;
            applyTemplate(STATE.composeTemplateId);
        }
    });

    updateNextStepButton();
    updateSortIndicators();
    updateThresholdVisibility();
    
    // Initialize step badge colors
    document.querySelectorAll('.ea-step-label').forEach(stepNode => {
        const badgeEl = stepNode.previousElementSibling;
        if (badgeEl && badgeEl.classList.contains('badge')) {
            badgeEl.classList.add('bg-secondary');
            badgeEl.classList.remove('bg-primary', 'bg-success');
        }
    });
    const firstBadge = document.querySelector('[data-step="1"]');
    if (firstBadge) {
        firstBadge.classList.remove('bg-secondary');
        firstBadge.classList.add('bg-primary');
    }
    
    document.querySelectorAll(SELECTORS.courseRow).forEach(row => {
        row.style.cursor = 'pointer';
    });
};
