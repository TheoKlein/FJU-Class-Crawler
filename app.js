var request = require('request');
var cheerio = require('cheerio');
var colors = require('colors');
var config = require('config');
var emoji = require('node-emoji');
var fs = require('fs');
var ProgressBar = require('progress');
var csvWriter = require('csv-write-stream');
var writer = csvWriter({
    sendHeaders: false
});

var arg = process.argv[2];

function crawler() {
    var d = new Date();
    var fileName = d.getTime() + '-第' + arg + '學期課程資料.csv';
    var url = "http://estu.fju.edu.tw/fjucourse/";

    switch (arg) {
        case '1':
            url += "Firstpage.aspx";
            break;
        case '2':
        default:
            url += "Secondpage.aspx";
            break;
    }

    console.log('\t檔案名稱：' + fileName);

    var divs = config.get('FJUCourse.divs');
    var divn = config.get('FJUCourse.divn');
    divs.forEach(function (div) {
        var options = {
            method: 'POST',
            url: url,
            headers: config.get('FJUCourse.headers'),
            form: {
                __VIEWSTATE: config.get('FJUCourse.__VIEWSTATE' + arg),
                __EVENTVALIDATION: config.get('FJUCourse.__EVENTVALIDATION' + arg),
                DDL_AvaDiv: div,
                DDL_Avadpt: 'All-全部',
                But_Run: '查詢（Search）'
            }
        };

        //console.log('\t' + emoji.get(':arrow_right') + '  正在連線輔大開課資料查詢系統...');

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            var $ = cheerio.load(body);
            var num = 0;

            console.log(
                '\n\t' + emoji.get(':white_check_mark') + '  連線完成，準備下載第' + arg + '學期[' + divn[div] + ']開課資料...\n' +
                '\t' + emoji.get(':warning') + '  正在下載第' + arg + '學期[' + divn[div] + ']開課資料，請勿關閉程式。'
            );
            var len = parseInt($('#GV_CourseList tr').length, 10);
            var bar = new ProgressBar('\t[:bar] :percent ETA :eta秒', {
                complete: '=',
                incomplete: ' ',
                width: 50,
                total: len
            });

            writer.pipe(fs.createWriteStream(fileName));

            $('#GV_CourseList tr').each(function () {
                if ($(this).find('td').eq(1).text()) {
                    writer.write({
                        CourseID: $(this).find('td').eq(1).text(),
                        Unit: $(this).find('td').eq(3).text(),
                        CourseCName: $('#GV_CourseList_Lab_Coucna_' + num).text(),
                        CourseEName: $('#GV_CourseList_Lab_Couena_' + num).text(),
                        Credit: $(this).find('td').eq(6).text(),
                        Type: $(this).find('td').eq(7).text(),
                        Term: $(this).find('td').eq(8).text(),
                        TeacherName: $('#GV_CourseList_Lab_Tchcna_' + num).text(),
                        TeacherSkill: $('#GV_CourseList_Lab_Tchskill_' + num).text(),
                        Language: $(this).find('td').eq(11).text(),
                        Week1: $(this).find('td').eq(12).text(),
                        Day1: $(this).find('td').eq(13).text(),
                        Time1: $(this).find('td').eq(14).text(),
                        Classroom1: $(this).find('td').eq(15).text(),
                        Week2: $(this).find('td').eq(16).text(),
                        Day2: $(this).find('td').eq(17).text(),
                        Time2: $(this).find('td').eq(18).text(),
                        Classroom2: $(this).find('td').eq(19).text(),
                        Week3: $(this).find('td').eq(20).text(),
                        Day3: $(this).find('td').eq(21).text(),
                        Time3: $(this).find('td').eq(22).text(),
                        Classroom3: $(this).find('td').eq(23).text(),
                        Senior: $(this).find('td').eq(24).text(),
                        Note: $(this).find('td').eq(25).text(),
                        Low: $('#GV_CourseList_Lab_SSyear_' + num).text(),
                        High: $('#GV_CourseList_Lab_SByear_' + num).text(),
                        Order: $('#GV_CourseList_Lab_AssignPriority_' + num).text(),
                        TotalNum: $('#GV_CourseList_Lab_totnum_' + num).text(),
                        OutNum: $('#GV_CourseList_Lab_outnum_' + num).text(),
                        Withdrew: $('#GV_CourseList_Lab_Kind_' + num).text(),
                        WithdrewYear: $('#GV_CourseList_Lab_RejectWithdrawYear_' + num).text(),
                        Field: $('#GV_CourseList_Lab_GGroupCna_' + num).text(),
                        Group: $('#GV_CourseList_Lab_GDptcna_' + num++).text(),
                        CourseCard: $(this).find('td').eq(38).text()
                    });
                }
                bar.tick(1);
            });
        });

    });
}

console.log();
fs.readFile('logo', 'utf8', function (err, data) {
    if (err) return console.log(err);
    console.log(data);

    if (arg && (arg == '1' | arg == '2')) {
        crawler();
    } else if (arg == 'help') {
        console.log('help');
        // TODO: Maybe add more help info.
    } else {
        console.log(
            '\n\t' + emoji.get(':exclamation') + '  你輸入的參數有誤 ' + emoji.get(':exclamation') + '\n\n' +
            '\t正確的命令格式：\n' +
            '\t$ node app.js [第1或2學期]\n\n' +
            '\t例如：\n' +
            '\t$ node app.js 1\t\t//下載第一學期的課程資料\n' +
            '\t$ node app.js 2\t\t//下載第二學期的課程資料\n\n' +
            '\t如果需要更多說明：\n\t$ node app.js help\n'
        );
    }
});
