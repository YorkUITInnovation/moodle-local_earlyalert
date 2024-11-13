
import ModalFactory from 'core/modal_factory';
import {get_string as getString} from 'core/str';
import Templates from 'core/templates';
import ajax from 'core/ajax';
/**
 * Modal for email template preview
 */
export const init = async () => {

    ModalFactory.create({
        title: getString('preview_email', 'local_earlyalert'),
        type: ModalFactory.types.CANCEL,
        body: Templates.render('local_earlyalert/preview_student_email', {name: 'etemplate name', student_name: 'Peter Parker', subject: 'Grade in AP/ECON 2350 3.00' , message: '<p> We know that many students juggle a lot alongside their academics. The academic advising team at the Faculty of Liberal Arts and Professional Studies works with professors to ensure that students receive information about their course progress so that way we can work with those who are facing challenges.<br>' +
                '    We’re reaching out because your course director, Nick Valentino, has notified our office that you are averaging less than D+ in AP/ECON 2350 3.00, which puts you in danger of failing. </p>' +
                '    <p><b><u>Your next step: Book an appointment with an advisor</u></b><br>' +
                '    We want you to know that you’re not alone – it’s not uncommon for students to experience academic difficulties. We’re here to support you, and so we’re inviting you to a coaching session with your advisors at LA&PS Academic Advising Services. <u>Connect with them</u> at a day or time that is convenient for you!</p>' +
                '    <p><b><u>Other helpful resources</u></b></br>' +
                '    Looking for ways to manage your time? Study and learn more effectively? Keep up with readings and course work? Let <u>Learning Skills Services</u> help you achieve those goals.</br>' +
                '    Feeling like you could use some extra support outside of the classroom? Explore <u>counselling and wellness resources </u>designed to help you navigate challenges and thrive throughout your journey here with us.</br>' +
                '    Just not the course for you? That’s totally okay too. If this is the case just be sure that you are aware of the drop/withdraw deadlines, and what they mean.</br>' +
                '    <p>Have unanswered questions? Why not <u>chat with SAVY?</u> You can ask SAVY about programs and courses, student life, campus services, career development and more.</p> ', instructor_name: ''}),
        large: true,

    }).then(modal => {
        const preview_button = document.getElementById('id_early_alert_filter_preview_button');
        if (preview_button) {
            preview_button.addEventListener('click', function() {
                modal.show();
            });
        }
    });
};

