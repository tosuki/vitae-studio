# Project Spec
- Essa é uma API que serve como auxilio pra interface Web. Ela vai proporcionar uma interface de interação com a aplicação web, para que ela consiga inspecionar e visualizar vagas do Linkedin e outras fontes. Para isso, será usado o puppeteer com stealth mode, para que ele consiga fazer essa interação com o linkedin e inspecionar as vagas. Depois de inspecionado, será retornado um metadata dela e as especificações seguindo o padrão estabelecido no schema enviado pelo frontend.

- A comunicação entre o frontend e essa api será feita através de uma API Restful (HTTP)

- Deverá ter sistema de jobs/filas, já que cada solicitação de extração de dados pode demorar um pouco, dessa forma o frontend não ficará travado e o tempo de conexão não vai expirar antes da tarefa acabar. 

- A construção da especificação do CV a partir de uma vaga, será feita através do Gemini.

