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
    thresholdMode: 'letter',
    thresholdPercent: 55,
    filterMode: 'course',
    gradeItemId: 0,
    gradeItemIds: [],
    includeAllStudents: false,
    gradeItemsLoadedForCourse: 0,
    multiMode: 'any',
    previewData: null,
    sortBy: 'name',
    sortDir: 'none',
    composeTemplates: [],
    composeTemplateId: '',
    previewRequestId: 0,
    customMessage: '',
    supportsCustomMessage: false,
    customMessageCheckRequestId: 0,
    currentPageStudentIds: [],
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
    openCustomMessage: '[data-action="earlyalert/open-custom-message"]',
    closeCustomMessage: '[data-action="earlyalert/close-custom-message"]',
    saveCustomMessage: '[data-action="earlyalert/save-custom-message"]',
    alertOption: '.ea-alert-option',
    gradeFilterMode: '#ea-grade-filter-mode',
    gradeItems: '#ea-grade-items',
    multiModeWrap: '#ea-multi-mode-wrap',
    multiModeRadios: 'input[name="ea-multi-mode"]',
};

const STRINGS = {};
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
        'multi_mode',
        'multi_mode_any',
        'multi_mode_average',
        'multi_mode_weighted',
    ];
    const values = await Promise.all(keys.map(key => Str.get_string(key, 'local_earlyalert').catch(() => key)));
    keys.forEach((key, index) => {
        STRINGS[key] = values[index];
    });
};

const root = () => document.getElementById('earlyalert-dashboard');

let previewModalInstance = null;
let customMessageModalInstance = null;

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
            const scriptscheme = 'javascript';
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
            if ((name === 'href' || name === 'src') && value.startsWith(`${scriptscheme}:`)) {
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

const getCustomMessageModal = () => {
    const modalEl = document.getElementById('ea-custom-message-modal');
    if (!modalEl) {
        return null;
    }

    if (!customMessageModalInstance && window.bootstrap && window.bootstrap.Modal) {
        customMessageModalInstance = new window.bootstrap.Modal(modalEl);
    }
    return {modalEl, instance: customMessageModalInstance};
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

const openCustomMessageModal = () => {
    const modal = getCustomMessageModal();
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

const closeCustomMessageModal = () => {
    const modal = getCustomMessageModal();
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

const updateCustomMessageUi = () => {
    const editButton = document.getElementById('ea-edit-custom-message-btn');
    if (editButton) {
        // Commendation templates map to catch-all messages and should always allow custom edits.
        const shouldShow = STATE.supportsCustomMessage || STATE.alertType === 'commendation';
        editButton.classList.toggle('d-none', !shouldShow);
        editButton.disabled = !shouldShow;
    }
};

const setCustomMessage = value => {
    STATE.customMessage = String(value || '');

    const modalField = document.getElementById('ea-custom-message-modal-text');
    if (modalField && modalField.value !== STATE.customMessage) {
        modalField.value = STATE.customMessage;
    }
};

const getCustomMessage = () => STATE.customMessage;

const getPreviewProbeStudentId = () => {
    const selectedIds = Array.from(STATE.selectedStudents.keys());
    if (selectedIds.length) {
        return selectedIds.find(id => STATE.studentDataById.has(id)) || selectedIds[0] || 0;
    }
    return STATE.currentPageStudentIds[0] || 0;
};

const refreshCustomMessageSupport = () => {
    const probeStudentId = getPreviewProbeStudentId();
    if (!probeStudentId || !STATE.courseId || !STATE.alertType) {
        STATE.supportsCustomMessage = false;
        updateCustomMessageUi();
        return;
    }

    const requestId = ++STATE.customMessageCheckRequestId;
    fetchStudentPreview(probeStudentId).then(response => {
        if (requestId !== STATE.customMessageCheckRequestId) {
            return;
        }

        STATE.supportsCustomMessage = !!response.hascustommessage;
        updateCustomMessageUi();
    }).catch(() => {
        if (requestId !== STATE.customMessageCheckRequestId) {
            return;
        }

        STATE.supportsCustomMessage = false;
        updateCustomMessageUi();
    });
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

    refreshCustomMessageSupport();
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
    const loadingtext = escapeHtml(STRINGS.loading || 'Loading...');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-muted py-4">${loadingtext}</td>
        </tr>`;
};

const getConditionForAlertType = alertType => {
    if (alertType === 'assign' || alertType === 'exam') {
        return 'missing';
    }
    if (alertType === 'commendation') {
        return 'above';
    }
    return 'below';
};

const updateThresholdVisibility = () => {
    const thresholdWrap = document.getElementById('ea-threshold-wrap');
    if (!thresholdWrap) {
        return;
    }
    thresholdWrap.style.display = STATE.condition === 'missing' ? 'none' : 'block';
    const letterWrap = document.getElementById('ea-threshold-letter-wrap');
    const percentWrap = document.getElementById('ea-threshold-percent-wrap');
    if (letterWrap) {
        letterWrap.classList.toggle('d-none', STATE.thresholdMode !== 'letter');
    }
    if (percentWrap) {
        percentWrap.classList.toggle('d-none', STATE.thresholdMode !== 'percent');
    }
};

const updateConditionForAlertType = () => {
    STATE.condition = getConditionForAlertType(STATE.alertType);
    const conditionDisplay = document.getElementById('ea-condition-display');
    if (conditionDisplay) {
        const conditionLabels = {
            'below': '<= (Below or equal to)',
            'above': '>= (Above or equal to)',
            'missing': 'Missing (no grade submitted)',
        };
        conditionDisplay.textContent = conditionLabels[STATE.condition] || STATE.condition;
    }
    updateThresholdVisibility();
};

const getAlertTypeLabel = () => {
    const selected = document.querySelector(`${SELECTORS.alertOption}.active .fw-semibold`);
    return selected ? selected.textContent.trim() : '';
};

const updateSelectedAlertTypeDisplay = () => {
    const label = getAlertTypeLabel();
    ['ea-step-2-alert-type', 'ea-step-3-alert-type'].forEach(id => {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = label;
        }
    });
};

const updateGradeFilterControls = () => {
    const modeSelect = document.querySelector(SELECTORS.gradeFilterMode);
    const itemSelect = document.querySelector(SELECTORS.gradeItems);
    const itemWrap = document.getElementById('ea-grade-items-wrap');
    const multiModeWrap = document.getElementById('ea-multi-mode-wrap');
    const mode = modeSelect?.value || STATE.filterMode || 'course';

    STATE.filterMode = ['course', 'single', 'multi'].includes(mode) ? mode : 'course';
    if (modeSelect) {
        modeSelect.value = STATE.filterMode;
    }
    if (!itemSelect) {
        return;
    }

    const isCourseMode = STATE.filterMode === 'course';
    const isMultiMode = STATE.filterMode === 'multi';
    itemSelect.disabled = isCourseMode;
    itemSelect.multiple = isMultiMode;
    itemSelect.size = isMultiMode ? 6 : 1;
    if (itemWrap) {
        itemWrap.style.display = isCourseMode ? 'none' : 'block';
    }
    if (multiModeWrap) {
        multiModeWrap.classList.toggle('d-none', !isMultiMode);
    }

    if (isCourseMode) {
        Array.from(itemSelect.options).forEach(option => {
            option.selected = false;
        });
        return;
    }

    const gradeOptions = Array.from(itemSelect.options);
    const selectedGradeOptions = Array.from(itemSelect.selectedOptions);
    if (!selectedGradeOptions.length && gradeOptions.length) {
        gradeOptions[0].selected = true;
    }
};

const updateFilterModeContainerVisibility = () => {
    const filterModeContainer = document.getElementById('ea-filter-mode-container');
    if (!filterModeContainer) {
        return;
    }

    filterModeContainer.classList.toggle('d-none', STATE.includeAllStudents);
};

const deriveFilterModeFromSelection = () => {
    updateGradeFilterControls();

    const modeSelect = document.querySelector(SELECTORS.gradeFilterMode);
    STATE.filterMode = modeSelect?.value || STATE.filterMode || 'course';

    const select = document.querySelector(SELECTORS.gradeItems);
    if (!select || STATE.filterMode === 'course') {
        STATE.filterMode = 'course';
        STATE.gradeItemId = 0;
        STATE.gradeItemIds = [];
        return;
    }

    const selected = Array.from(select.selectedOptions)
        .map(option => parseInt(option.value || '0', 10))
        .filter(value => !Number.isNaN(value));

    if (STATE.filterMode === 'single') {
        STATE.filterMode = 'single';
        STATE.gradeItemId = selected[0] || 0;
        STATE.gradeItemIds = [];
        return;
    }

    STATE.filterMode = 'multi';
    STATE.gradeItemId = 0;
    STATE.gradeItemIds = selected;

    const multiModeRadio = document.querySelector(`${SELECTORS.multiModeRadios}:checked`);
    if (multiModeRadio) {
        STATE.multiMode = multiModeRadio.value;
    }
};

const getThresholdPercentArg = () => {
    if (STATE.thresholdMode !== 'percent') {
        return -1;
    }
    const raw = parseFloat(String(STATE.thresholdPercent));
    if (Number.isNaN(raw)) {
        return -1;
    }
    return Math.max(0, Math.min(100, raw));
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
        (items || []).forEach(item => {
            if (parseInt(item.id, 10) !== 0 && item.itemtype !== 'course') {
                optionHtml.push(`<option value="${parseInt(item.id, 10)}">${escapeHtml(item.name || '')}</option>`);
            }
        });
        select.innerHTML = optionHtml.join('');
        STATE.gradeItemsLoadedForCourse = STATE.courseId;
        updateGradeFilterControls();
        deriveFilterModeFromSelection();
    }).catch(Notification.exception);
};

const loadStudents = () => {
    if (!STATE.courseId || !STATE.alertType) {
        return;
    }

    updateConditionForAlertType();
    deriveFilterModeFromSelection();
    setLoadingRows();

    const search = document.getElementById('ea-search')?.value || '';

    Ajax.call([{methodname: 'local_earlyalert_get_course_students_page', args: {
        courseid: STATE.courseId,
        teacher_user_id: STATE.teacherUserId,
        alert_type: STATE.alertType,
        filtermode: STATE.filterMode,
        multimode: STATE.multiMode,
        condition: STATE.condition,
        thresholdid: STATE.thresholdId,
        thresholdpercent: getThresholdPercentArg(),
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
            STATE.currentPageStudentIds = [];
            const nostudents = escapeHtml(STRINGS.no_students_found || 'No students found');
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">${nostudents}</td>
                </tr>`;
            updatePaginationUi(response);
            refreshCustomMessageSupport();
            return;
        }

        const students = sortStudents(response.students);
        STATE.currentPageStudentIds = students
            .map(student => parseInt(student.id, 10))
            .filter(studentid => !Number.isNaN(studentid));

        tbody.innerHTML = students.map(student => {
            STATE.studentDataById.set(student.id, student);
            const checked = STATE.selectedStudents.has(student.id) ? 'checked' : '';
            const fullname = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
            const email = student.email ? `<div class="small text-muted">${escapeHtml(student.email)}</div>` : '';
            const matchedItems = String(student.matcheditems || '')
                .split('\n')
                .map(item => item.trim())
                .filter(Boolean);
            const matchedItemsHtml = matchedItems.length
                ? matchedItems.map(item => `<div>${escapeHtml(item)}</div>`).join('')
                : '<span class="text-muted">-</span>';
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input ea-student-checkbox"
                            data-student-id="${student.id}" ${checked}>
                    </td>
                    <td>
                        <div class="fw-semibold">${escapeHtml(fullname)}</div>
                        ${email}
                    </td>
                    <td>${escapeHtml(student.idnumber || '')}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(student.grade || '')}</span></td>
                    <td class="small">${matchedItemsHtml}</td>
                    <td class="text-end">
                        <button type="button" class="btn btn-outline-secondary btn-sm ea-student-preview"
                            data-student-id="${student.id}">
                            ${escapeHtml(STRINGS.preview_email || 'Preview')}
                        </button>
                    </td>
                </tr>`;
        }).join('');

        updatePaginationUi(response);
        updateSelectionState();
        updateSortIndicators();
    }).catch(Notification.exception);
};

const updateComposeSummary = () => {
    const summary = document.getElementById('ea-compose-summary');
    if (!summary) {
        return;
    }

    const count = STATE.selectedStudents.size;
    summary.textContent = `Sending to ${count} students. Personalization tokens are filled automatically when sent.`;
};

const getFirstSelectedStudentId = () => {
    const selectedIds = Array.from(STATE.selectedStudents.keys());
    return selectedIds.find(id => STATE.studentDataById.has(id)) || selectedIds[0] || 0;
};

const fetchStudentPreview = studentid => Ajax.call([{methodname: 'local_earlyalert_get_student_preview_template', args: {
    courseid: STATE.courseId,
    teacher_user_id: STATE.teacherUserId,
    studentid,
    alert_type: STATE.alertType,
    thresholdid: STATE.thresholdId,
    thresholdpercent: getThresholdPercentArg(),
    assignment_title: '',
    custom_message: getCustomMessage(),
}}])[0];

const renderComposePreview = () => {
    const subjectNode = document.getElementById('ea-message-preview-subject');
    const bodyNode = document.getElementById('ea-message-preview-text');
    if (!subjectNode || !bodyNode) {
        return;
    }

    const studentId = getFirstSelectedStudentId();
    if (!studentId) {
        subjectNode.textContent = '';
        renderMessageHtml(bodyNode, STRINGS.preview_message_placeholder || '');
        return;
    }

    const requestId = ++STATE.previewRequestId;
    subjectNode.textContent = STRINGS.loading || 'Loading...';
    bodyNode.textContent = '';

    fetchStudentPreview(studentId).then(response => {
        if (requestId !== STATE.previewRequestId) {
            return;
        }
        subjectNode.textContent = response.subject || '';
        renderMessageHtml(bodyNode, response.message || '');
    }).catch(error => {
        if (requestId !== STATE.previewRequestId) {
            return;
        }
        subjectNode.textContent = '';
        renderMessageHtml(bodyNode, STRINGS.preview_message_placeholder || '');
        Notification.exception(error);
    });
};

const initComposeForm = () => {
    setCustomMessage(STATE.customMessage);
    updateCustomMessageUi();
    updateComposeSummary();
    renderComposePreview();
};

const updatePreview = () => {
    renderComposePreview();
};

const previewStudent = studentid => {
    fetchStudentPreview(studentid).then(response => {
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

    const header = ['Student Name', 'Email', STRINGS.student_id || 'Student ID', 'Grade', 'Matched Items'];
    const lines = [header.map(toCsv).join(',')];

    rows.forEach(student => {
        const fullname = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
        lines.push([
            toCsv(fullname),
            toCsv(student.email || ''),
            toCsv(student.idnumber || ''),
            toCsv(student.grade || ''),
            toCsv(student.matcheditems || ''),
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

const buildResolvedAlertPayload = studentid => fetchStudentPreview(studentid).then(response => {
    const student = STATE.studentDataById.get(studentid) || {};
    return {
        student_id: studentid,
        template_id: response.templateid || 0,
        revision_id: response.revision_id || 0,
        triggered_from_user_id: response.triggered_from_user_id || STATE.teacherUserId,
        course_id: response.course_id || STATE.courseId,
        instructor_id: response.instructor_id || STATE.teacherUserId,
        assignment_name: '',
        trigger_grade: STATE.thresholdId,
        threshold_mode: STATE.thresholdMode,
        threshold_percent: STATE.thresholdMode === 'percent' ? getThresholdPercentArg() : null,
        actual_grade: student.grade || '',
        custom_message: getCustomMessage(),
        subject: response.subject || '',
        message: response.message || '',
    };
});

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
            Promise.all(ids.map(buildResolvedAlertPayload)).then(templateData => {
                const missingTemplates = templateData.filter(item => !item.template_id);
                if (missingTemplates.length) {
                    const missingtemplatemessage = 'One or more selected students do not have an active eTemplate for '
                        + 'this alert. No alerts were queued.';
                    Notification.alert('', missingtemplatemessage);
                    return;
                }

                Ajax.call([{methodname: 'local_earlyalert_report_log_insert', args: {
                    template_data: JSON.stringify(templateData),
                }}])[0].then(() => {
                    Notification.alert('', STRINGS.alert_sent_successfully || 'Alert sent successfully');
                }).catch(Notification.exception);
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
        updateConditionForAlertType();
        updateSelectedAlertTypeDisplay();
        updateGradeFilterControls();
        loadGradeItems().then(() => {
            loadStudents();
        }).catch(Notification.exception);
    }
    if (step === 3) {
        updateSelectedAlertTypeDisplay();
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
    STATE.customMessage = '';
    STATE.supportsCustomMessage = false;
    STATE.customMessageCheckRequestId = 0;
    STATE.currentPageStudentIds = [];
    STATE.page = 1;
    STATE.totalPages = 1;
    STATE.perPage = 10;
    STATE.includeAllStudents = false;
    STATE.thresholdMode = 'letter';
    STATE.thresholdPercent = 63;
    STATE.filterMode = 'course';
    STATE.gradeItemId = 0;
    STATE.gradeItemIds = [];
    STATE.gradeItemsLoadedForCourse = 0;
    STATE.sortBy = 'name';
    STATE.sortDir = 'none';

    const courseLink = document.getElementById('ea-selected-course-link');
    if (courseLink) {
        courseLink.textContent = STATE.courseName;
        courseLink.href = `/course/view.php?id=${STATE.courseId}`;
    }
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
    const filterModeSelect = document.querySelector(SELECTORS.gradeFilterMode);
    if (filterModeSelect) {
        filterModeSelect.value = 'course';
    }
    const thresholdModeSelect = document.getElementById('ea-threshold-mode');
    if (thresholdModeSelect) {
        thresholdModeSelect.value = 'letter';
    }
    const thresholdPercentInput = document.getElementById('ea-threshold-percent');
    if (thresholdPercentInput) {
        thresholdPercentInput.value = '63';
    }
    const includeAll = document.getElementById('ea-include-all-students');
    if (includeAll) {
        includeAll.checked = false;
    }

    updateSelectedAlertTypeDisplay();
    updateGradeFilterControls();
    updateFilterModeContainerVisibility();
    updateThresholdVisibility();
    setCustomMessage('');
    updateCustomMessageUi();

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

        if (event.target.closest(SELECTORS.openCustomMessage)) {
            if (!STATE.supportsCustomMessage && STATE.alertType !== 'commendation') {
                return;
            }
            setCustomMessage(STATE.customMessage);
            openCustomMessageModal();
            return;
        }

        if (event.target.closest(SELECTORS.closeCustomMessage)) {
            closeCustomMessageModal();
            return;
        }

        if (event.target.closest(SELECTORS.saveCustomMessage)) {
            const modalField = document.getElementById('ea-custom-message-modal-text');
            setCustomMessage(modalField?.value || '');
            closeCustomMessageModal();
            updatePreview();
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
            document.querySelectorAll(SELECTORS.alertOption).forEach(option => option.classList.remove('active'));
            button.classList.add('active');
            updateConditionForAlertType();
            updateSelectedAlertTypeDisplay();
            updateNextStepButton();
            if (STATE.alertType) {
                showStep(2);
            }
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
            setCustomMessage('');
            updatePreview();
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

    document.addEventListener('change', event => {
        if (event.target.id === 'ea-grade-threshold') {
            STATE.thresholdId = parseInt(event.target.value || '7', 10);
        }
        if (event.target.id === 'ea-threshold-mode') {
            STATE.thresholdMode = event.target.value === 'percent' ? 'percent' : 'letter';
            updateThresholdVisibility();
        }
        if (event.target.id === 'ea-threshold-percent') {
            const value = parseFloat(event.target.value || '0');
            if (!Number.isNaN(value)) {
                STATE.thresholdPercent = Math.max(0, Math.min(100, value));
                event.target.value = String(STATE.thresholdPercent);
            }
        }
        if (event.target.id === 'ea-condition') {
            updateConditionForAlertType();
        }
        if (event.target.id === 'ea-grade-filter-mode') {
            STATE.filterMode = event.target.value;
            STATE.page = 1;
            updateGradeFilterControls();
            deriveFilterModeFromSelection();
            loadStudents();
        }
        if (event.target.id === 'ea-grade-items') {
            deriveFilterModeFromSelection();
        }
        if (event.target.matches(SELECTORS.multiModeRadios)) {
            STATE.multiMode = event.target.value;
            STATE.page = 1;
            loadStudents();
        }
        if (event.target.id === 'ea-include-all-students') {
            STATE.includeAllStudents = !!event.target.checked;
            STATE.page = 1;
            updateFilterModeContainerVisibility();
            loadStudents();
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
    });

    updateNextStepButton();
    updateSortIndicators();
    updateGradeFilterControls();
    updateFilterModeContainerVisibility();
    updateThresholdVisibility();
    updateCustomMessageUi();

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
