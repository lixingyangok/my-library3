<!--
 * @Author: Merlin
 * @Date: 2024-02-04 15:59:59
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-04 22:33:59
 * @Description: 
-->
<template>
    <div class="top-box" >
        <el-button type="primary"
            @click="oFn.showAddingDialog"
        >
            添加
        </el-button>
        <el-button type="primary">
            添加短文/文章/书籍
        </el-button>
        <ul class="article-list" >
            <li v-for="(cur, idx) of aArtile" :key="cur.id" >
                中文标题：{{ cur.titleZh }}
                <br/>
                英文标题：{{ cur.titleEn }}
                <br/>
                <el-button link type="primary"
                    @click="oFn.read(cur)"
                >
                    阅读
                </el-button>
                <el-button link type="primary"
                    @click="oFn.editeArtile(cur)"
                >
                    修改
                </el-button>
                <el-button link type="primary"
                    @click=oFn.delArtile(cur)
                >
                    删除
                </el-button>
            </li>
        </ul>
        <hr/>
        <article class="article" >
            <section v-for="(aRows, idx) of aSection" :key="idx">
                <span class="sentence" v-for="(oLine, idx) of aRows" :key="oLine.id" >
                    <!-- {{ idx ? '&nbsp;': '' }} -->
                    {{ oLine.text }}
                </span>
            </section>
        </article>
    </div>
    <!--  -->
    <el-dialog
        title="添加"
        width="900px"
        top="10vh"
        v-model="dialogVisible"
    >
        <el-form :model="addingForm"
            label-width="80px"
        >
            <el-form-item label="中文名">
                <el-input v-model="addingForm.titleZh" />
            </el-form-item>
            <el-form-item label="英文名">
                <el-input v-model="addingForm.titleEn" />
            </el-form-item>
            <el-form-item label="描述">
                <el-input v-model="addingForm.desc" type="textarea" 
                    :autosize="{ minRows: 2, maxRows: 4 }"
                    maxlangth="800"
                />
            </el-form-item>
            <el-form-item label="笔记">
                <el-input v-model="addingForm.note" type="textarea" 
                    :autosize="{ minRows: 2, maxRows: 4 }"
                    maxlangth="800"
                />
            </el-form-item>
            <el-form-item label="正文"
                v-if="addingForm.id > 0 === false"
            >
                <el-input v-model="addingForm.article" type="textarea" 
                    :autosize="{ minRows: 5, maxRows: 15 }"
                />
            </el-form-item>
        </el-form>
        <!--  -->
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false" >
                    Cancel
                </el-button>
                <el-button type="primary" @click="oFn.clickSave">
                    Confirm
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { onMounted } from 'vue';
import {useFn} from './js/study.js';

const dialogVisible = ref(false);
const aArtile = reactive([]);
const addingFormEmpty = Object.freeze({
    id: null,
    titleZh: '',
    titleEn: '',
    note: '',
    desc: '',
    article: getTxt(),
});

const aSection = reactive([]);
const aLines = reactive([]);

const addingForm = reactive({
    ...addingFormEmpty,
    article: getTxt(),
});

const oFn = useFn();

console.log('oFn1')
onMounted(async ()=>{
    console.log('oFn2')
    console.log(oFn)
    oFn.getArticleList();
});


function getTxt(){
    var sss = `
    Chapter 1. A SPECKLED BEAUTY
Henrietta Hen thought highly of her‧self 她自己. Not only did she consider her‧self 她自己 a "speckled beauty" (to use her own words) but she had an excellent opinion of her own ways, her own ideas—even of her own belongings. When she pulled a fat worm—or a grub—out of the ground she did it with an air of pride; and she was almost sure to say, "There! I'd like to see any‧body else find a bigger one than that!"

Of course, it wouldn't really have pleased her at all to have one of her neighbors do better than she did. That was only her way of boasting that no one could beat her.

If any one happened to mention speckles Henrietta Hen was certain to speak of her own, claiming that they were the hand‧some 英俊 and most speckly to be found in Pleasant Valley. And if a person chanced to say anything about combs, Henrietta never failed to announce 宣布 that hers was the reddest and most beautiful 美丽 in the whole world.

Nobody could ever find out how she knew that. She had never been off the farm. But it was use‧less 无用 to remind her that she had never travelled. Such a remark only made her angry.

Having such a good opinion of her‧self 她自己, Henrietta Hen always had a great deal to talk about. She kept up a constant 不变 cluck from dawn 黎明 till dusk 黄昏. It made no difference to her whether she happened to be alone, or with friends. She talked just the same—though naturally she preferred to have others hear what she said, because she considered her remarks most important.

There were times when Henrietta Hen took pains that all her neighbors should hear her. She was never so proud as when she had a newly-laid egg to exhibit 展示. Then an ordinary cluck was not loud enough to express her feelings. To announce 宣布 such important news Henrietta Hen never failed to raise her voice in a high-pitched 沥青 "Cut-cut-cut, ca-dah-cut!" This interesting speech she always repeated several times. For she wanted every‧body to know that Henrietta Hen had laid another of her famous 著名 eggs.

After such an event she always went about asking people if they had heard the news—just as if they could have helped hearing her silly 愚蠢 racket 球拍!

Now, it sometimes happened, when she was on such an errand 使命, that Henrietta Hen met with snubs. Now and then her question—"Have you heard the news?"—brought some such sallies as these: "Polly Plymouth Rock has just laid an enormous 巨大 egg! Have you seen it?" Or maybe, "Don't be disappointed, Henrietta! Somebody has to lay the littlest ones!"

Such jibes were certain to make Henrietta Hen lose her temper. And she would talk very fast (and, alas 唉! very loud, too) about jealous neighbors and how unpleasant 不愉快 it was to live among folk 民间 that were so stingy of their praise that they couldn't say a good word for the finest eggs that ever were seen! On such occasions Henrietta Hen generally talked in a lofty 高远 way about moving to the village to live.

"They think enough of my eggs down there," she would boast. "Boiled, fried, poached 偷猎, scrambled 争夺, or for an omelette—my eggs can't be beaten."

"If the villagers 村民 can't beat your eggs they certainly can't use them for omelettes," Polly Plymouth Rock told Henrietta one day. " Everybody knows you have to beat eggs to make an omelette."

Henrietta Hen didn't know what to say to that. It was almost the only time she was ever known to be silent.

本章常用生词：15
(回忆一下，想不起来就点击单词)

eggs 6
neighbors 3
beat 3
news 3
egg 2
loud 2
everybody 2
heard 2
rock 2
excellent 1
belongings 1
fat 1
worm 1
ground 1
pride 1


Chapter 2. A FINE FAMILY
Henrietta Hen's neighbors paid little attention to her boasting, because they had to listen to it so often. At last, however, there came a day when she set up such a cackling as they had never heard from her before. She kept calling out at the top of her lungs, "Come-come-come! See-what-I've-got! Come-come-come! See-what-I've-got!" And she acted even more important than ever, until her friends began to say to one another, "What can Henrietta be so proud about? If it's only another egg, she's making a terrible fuss 小题大作 about it."

They decided at last that if they were to have any peace they'd better go and look at what‧ever it was that Henrietta Hen was squawking about. So they went—in a body—to the place where she had her nest, in the haymow.

When Henrietta caught sight of her visitors she set up a greater clamor 叫嚣 than ever.

"Well, well!" cried the oldest of the party, a rather sharp-tongued dame with white feathers. "What's all this hubbub about?" And then they learned what it was that Henrietta wanted them to see.

"Did you ever set eyes on such a fine family?" she demanded as she stepped aside from her nest and let them peer 窥视 into it.

"A brood 窝 of chicks 小鸡—eh?" said the lady in white. "Well, what's all the noise about?"

Henrietta Hen turned her back on her questioner.

"I knew you'd all want to have a look at these prize youngsters 青少年," she said to the rest of the company. "You'll agree with me, of course, that there were never any other chicks 小鸡 as hand‧some 英俊 as these."

Henrietta's neighbors all crowded up to gaze 凝视 upon the soft balls of down.

"This is the first family you've hatched 孵化, isn't it?" Polly Plymouth Rock inquired.

Henrietta Hen said that it was her first brood 窝.

Her neighbors wanted to be pleasant. So they told her that her children were as fine youngsters 青少年 as any‧body could ask for. And the old white dame, squinting at the nestlings 贴近, said to Henrietta:

"They're the finest you've ever had.... But there's one of them that has a queer 奇怪 look."

All the other visitors tried to hush 嘘 her up. They didn't want to hurt Henrietta Hen's feelings. It was her first brood 窝 of chicks 小鸡; and they could for‧give her for thinking them the best in the whole world. So when they saw that old Whitey intended to be disagree‧able 不同意‧能够的 they began to cluck their approval of the youngsters 青少年, hoping that Henrietta wouldn't notice what Whitey said.

Nor did she. Henrietta Hen was altogether too pleased with her‧self 她自己 and her new family to pay much attention to any‧body else's remarks.

"I hope," said Henrietta, "that you'll all come to see my family often. As the youngsters 青少年 grow, I'm sure they'll get hand‧some 英俊 every day."

The neighbors thanked her. And crowding about old Whitey they moved away. Old Whitey just had to go too. She couldn't help spluttering a little.

"What a vain, empty-headed creature Henrietta Hen is!" she exclaimed 喊叫. "She doesn't know that one of her brood 窝 is nothing but a duckling!"

本章常用生词：15
(回忆一下，想不起来就点击单词)

neighbors 4
nest 2
visitors 2
anybody 2
paid 1
boasting 1
heard 1
kept 1
lungs 1
proud 1
egg 1
terrible 1
whatever 1
caught 1
sight 1


Chapter 3. WET FEET
Somehow Henrietta Hen never noticed that one of her brood 窝 was different from the rest. They were her first youngsters 青少年 and they all looked beautiful 美丽 to her.

Just as soon as Henrietta began to take her children for strolls 漫步 about the farm‧yard 农场‧院子 she taught them a number of things. She showed them how to scratch in the dirt for food, how to drink by raising their heads and letting the water trickle 潺 down their throats. She bade them beware 谨防 of hawks 鹰—and of Miss Kitty Cat, too. And she was always warning them to keep their feet dry.

"Water's good for nothing except to drink," Henrietta informed her chicks 小鸡. "Some strange people, like old dog Spot, jump right into it. And how they manage to keep well is more than I can understand. Dust baths are the only safe ones."

So much did she fear water that Henrietta Hen wouldn't even let her children walk in the grass until the sun had dried the morning's dew. And the first sprinkle 撒 of rain was enough to send her scurrying for cover, calling frantically 疯狂 for her chicks 小鸡 to hurry.

Now, there was one of her family that always lagged 落后 behind when the rain-drops began to fall. And often Henrietta had fairly to drive him away from a puddle of water. She sometimes remarked with a sigh 叹 that he gave her more trouble than all the rest of her children together.

This was the youngster 青少年 that Mrs. Hen's neighbors told one another was different from his brothers and sisters. But poor Henrietta Hen only knew that he was unusually 异常 hard to manage.

As her family grew bigger, Henrietta Hen took them on longer strolls 漫步, always casting 种姓 a careful 小心 eye aloft now and then, lest 免得 some hawk 鹰 should swoop 落下 down upon her darlings 宠儿. And though no hawk 鹰 tried to surprise her, something happened one day that gave Henrietta almost as great a fright as any cruel hawk 鹰 could have caused her.

They had strayed 流浪 down by the duck-pond 池塘—had Henrietta and her children, stopping here and there to scratch for some tidbit, or to flutter 扑 in an inviting dust-heap. Once they had reached the bank of the pond 池塘 Henrietta began to wish she hadn't brought her family in that direction. For one of the youngsters 青少年—the one that never would hurry in out of the rain—insisted 咬定 on toddling down to the water's edge.

"Come away this instant!" Henrietta shrieked 尖叫, as soon as she noticed where he was. "You'll get your feet wet the first thing you know."

She never said anything truer than that. The words were scarcely out of her bill when the odd 奇 member of her family flung himself into the water. Or to be more exact, he flung himself upon it; for he floated on the surface as easily as a chip 芯片 and began to paddle 桨 about as if he had swum all his life.

"Come back! Come back!" Henrietta Hen shrieked 尖叫. "You'll be drowned—and you'll get your feet wet!"
    `;
    return sss;
}

</script>


<style scoped lang="scss" src="./style/study.scss"></style>