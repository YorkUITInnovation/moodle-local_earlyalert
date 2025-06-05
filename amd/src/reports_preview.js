import ModalFactory from 'core/modal_factory';
import Templates from 'core/templates';
import Ajax from 'core/ajax';
import {get_string as getString} from 'core/str';

export const init = async () => {
    const previewBtn = document.getElementById('id_preview_results');
    if (!previewBtn) return;
    previewBtn.addEventListener('click', async () => {
        const sqlInput = document.getElementById('id_sqlquery');
        if (!sqlInput) return;
        const sqlquery = sqlInput.value;
        console.log('SQL Query:', sqlquery);

        const [result] = await Ajax.call([
            {
                methodname: 'earlyalert_get_table_results',
                args: {
                    query: sqlquery,
                    limit: 100, // Adjust limit as needed
                    offset: 0, // Adjust offset as needed
                    params: '{}' // Add any additional parameters if required
                }
            }
        ])[0].then(result => {
            const modal = ModalFactory.create({
                title: 'Preview Results',
                body: result.table,
                footer: '',
                large: true,
            }).then(modal => {
                modal.show();
            });
        }).catch(error => {
            // Optionally handle error
            console.error(error);
        });

    });
};

