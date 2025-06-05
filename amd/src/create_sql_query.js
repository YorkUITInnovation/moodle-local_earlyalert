import ajax from 'core/ajax';

export const init = async () => {
    const createBtn = document.getElementById('id_create_query');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            // Get prompt value from textarea with id 'id_prompt'
            const prompt = document.getElementById('id_prompt').value;
            console.log('Prompt:', prompt);
            ajax.call([
                {
                    methodname: 'earlyalert_ai_execute',
                    args: {
                        prompt: prompt,
                    }, // Add any required arguments here
                }
            ])[0].then(result => {
                const textarea = document.getElementById('id_sqlquery');
                if (textarea) {
                    textarea.value = result.results;
                }
            }).catch(error => {
                // Optionally handle error
                console.error(error);
            });
        });
    }
};

