const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let fixedCount = 0;

// Specific map of corrupted tokens to clean Portuguese words
const wordMap = [
    // Specific compound corruptions
    [/TÃtulos/g, 'Títulos'],
    [/tÃtulo/g, 'título'],
    [/TÃtulo/g, 'Título'],
    [/tÃtulos/g, 'títulos'],
    [/RelatÃ³rios/g, 'Relatórios'],
    [/RelatÃ³rio/g, 'Relatório'],
    [/relatÃ³rio/g, 'relatório'],
    [/relatÃ³rios/g, 'relatórios'],
    [/CobranÃ§as/g, 'Cobranças'],
    [/cobranÃ§a/g, 'cobrança'],
    [/CobranÃ§a/g, 'Cobrança'],
    [/cobranÃ§as/g, 'cobranças'],
    [/AutomÃ¡ticas/g, 'Automáticas'],
    [/automÃ¡tica/g, 'automática'],
    [/AutomÃ¡tico/g, 'Automático'],
    [/automÃ¡tico/g, 'automático'],
    [/HistÃ³rico/g, 'Histórico'],
    [/histÃ³rico/g, 'histórico'],
    [/VisÃ£o/g, 'Visão'],
    [/visÃ£o/g, 'visão'],
    [/GestÃ£o/g, 'Gestão'],
    [/gestÃ£o/g, 'gestão'],
    [/ConfiguraÃ§Ãµes/g, 'Configurações'],
    [/configuraÃ§Ãµes/g, 'configurações'],
    [/InformaÃ§Ãµes/g, 'Informações'],
    [/informaÃ§Ãµes/g, 'informações'],
    [/InformaÃ§Ã£o/g, 'Informação'],
    [/informaÃ§Ã£o/g, 'informação'],
    [/DescriÃ§Ã£o/g, 'Descrição'],
    [/descriÃ§Ã£o/g, 'descrição'],
    [/IntegraÃ§Ãµes/g, 'Integrações'],
    [/integraÃ§Ãµes/g, 'integrações'],
    [/AÃ§Ãµes/g, 'Ações'],
    [/aÃ§Ãµes/g, 'ações'],
    [/ObservaÃ§Ãµes/g, 'Observações'],
    [/observaÃ§Ãµes/g, 'observações'],
    [/MovimentaÃ§Ãµes/g, 'Movimentações'],
    [/movimentaÃ§Ãµes/g, 'movimentações'],
    [/SituaÃ§Ã£o/g, 'Situação'],
    [/situaÃ§Ã£o/g, 'situação'],
    [/ConclusÃ£o/g, 'Conclusão'],
    [/conclusÃ£o/g, 'conclusão'],
    [/ManutenÃ§Ãµes/g, 'Manutenções'],
    [/manutenÃ§Ãµes/g, 'manutenções'],
    [/ComissÃµes/g, 'Comissões'],
    [/comissÃµes/g, 'comissões'],
    [/TransaÃ§Ãµes/g, 'Transações'],
    [/transaÃ§Ãµes/g, 'transações'],
    [/ProjeÃ§Ãµes/g, 'Projeções'],
    [/projeÃ§Ãµes/g, 'projeções'],
    [/ConciliaÃ§Ã£o/g, 'Conciliação'],
    [/conciliaÃ§Ã£o/g, 'conciliação'],
    [/FaturaÃ§Ã£o/g, 'Faturação'],
    [/faturaÃ§Ã£o/g, 'faturação'],
    [/CatÃ¡logo/g, 'Catálogo'],
    [/catÃ¡logo/g, 'catálogo'],
    [/MÃªs/g, 'Mês'],
    [/mÃªs/g, 'mês'],
    [/PerÃodo/g, 'Período'],
    [/perÃodo/g, 'período'],
    [/UsuÃ¡rio/g, 'Usuário'],
    [/usuÃ¡rio/g, 'usuário'],
    [/UsuÃ¡rios/g, 'Usuários'],
    [/usuÃ¡rios/g, 'usuários'],
    [/PermissÃµes/g, 'Permissões'],
    [/permissÃµes/g, 'permissões'],
    [/PatrimÃ´nio/g, 'Patrimônio'],
    [/patrimÃ´nio/g, 'patrimônio'],
    [/OrÃ§amento/g, 'Orçamento'],
    [/orÃ§amento/g, 'orçamento'],
    [/NotificaÃ§Ãµes/g, 'Notificações'],
    [/notificaÃ§Ãµes/g, 'notificações'],
    [/CoraÃ§Ã£o/g, 'Coração'],
    [/coraÃ§Ã£o/g, 'coração'],
    [/AprovaÃ§Ã£o/g, 'Aprovação'],
    [/aprovaÃ§Ã£o/g, 'aprovação'],
    [/PublicaÃ§Ã£o/g, 'Publicação'],
    [/publicaÃ§Ã£o/g, 'publicação'],
    [/AnotaÃ§Ãµes/g, 'Anotações'],
    [/anotaÃ§Ãµes/g, 'anotações'],

    // Raw character pattern fallbacks
    [/Ã§/g, 'ç'],
    [/Ã³/g, 'ó'],
    [/Ã¡/g, 'á'],
    [/Ã£/g, 'ã'],
    [/Ã©/g, 'é'],
    [/Ãª/g, 'ê'],
    [/Ã­/g, 'í'],
    [/Ã´/g, 'ô'],
    [/Ãº/g, 'ú'],
    [/Ã€/g, 'À'],
    [/Ã/g, 'Á'],
    [/Ã‰/g, 'É'],
    [/Ã“/g, 'Ó'],
    [/Ãš/g, 'Ú'],
    [/Âº/g, 'º'],
    [/Âª/g, 'ª']
];

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let fixed = content;

    wordMap.forEach(([regex, rep]) => {
        fixed = fixed.replace(regex, rep);
    });

    if (fixed !== content) {
        fs.writeFileSync(filePath, fixed, 'utf-8');
        console.log('Fixed Portuguese text encoding in:', filePath);
        fixedCount++;
    }
});

console.log(`Total files repaired: ${fixedCount}`);
