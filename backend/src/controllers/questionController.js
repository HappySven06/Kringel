import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import db from '../database/drizzle.js';
import minio from '../database/minio.js';
import questionModel from '../database/models/question.js';
import questionMatrix from '../database/models/questionMatrix.js';
import answerVariant from '../database/models/answerVariant.js';
import * as zod from '../database/zod.js';

export const upload = async (req, res) => {
  const serverUserData = req.serverUserData;

  const result = zod.questionSchema.safeParse(req.body);

  if (!result.success) {
    console.log(result.error.flatten());
    console.log(req.body);
    return res.status(400).json({ error: 'Bad data given' });
  }

  const { blockId, question, points, answerType, orderNumber, answerVariables = null } = result.data;
  const questionId = uuidv7();

  const insertQuestion = async (
    insertId,
    insertBlockId,
    insertMatrixId,
    insertType,
    insertOrderNumber,
    insertDescription,
    insertPoints
  ) => {
    await db
      .insert(questionModel)
      .values({
        id: insertId,
        blockId: insertBlockId,
        matrixId: insertMatrixId !== undefined ? insertMatrixId : null,
        type: insertType,
        orderNumber: insertOrderNumber,
        description: insertDescription,
        points: insertPoints,
      });
  };

  const insertAnswer = async (insertId, insertQuestionId, insertCorrect, thisAnswer) => {
    await db
      .insert(answerVariant)
      .values({
        id: insertId,
        questionId: insertQuestionId,
        correct: insertCorrect,
        answer: thisAnswer,
      });
  };

  if (answerType === 3) {
    try {
      await db
        .insert(questionMatrix)
        .values({ id: questionId, blockId, orderNumber, description: question, points });

      answerVariables.forEach(async question => {
        try {
          const matrixQuestionId = uuidv7();

          insertQuestion(
            matrixQuestionId,
            question.blockId,
            questionId,
            question.answerType,
            question.orderNumber,
            question.question,
            question.points
          );

          question.answerVariables.forEach(async answer => {
            try {
              insertAnswer(uuidv7(), questionId, answer.question, answer.answer);
            } catch (err) {
              return res.status(500).json({ error: 'Failed to answer variant' });
            }
          });
        } catch (err) {
          return res.status(500).json({ error: 'Failed to create question' });
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create matrix question' });
    }

    return res.status(200).json({ message: 'Matrix question created', id: questionId });
  } else {
    try {
      insertQuestion(questionId, blockId, null, answerType, orderNumber, question, points);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create question' });
    }

    if(answerVariables){
      answerVariables.forEach(async answer => {
        try {
          insertAnswer(uuidv7(), questionId, answer.question, answer.correct, answer.answer);
        } catch (err) {
          return res.status(500).json({ error: 'Failed to answer variant' });
        }
      });
    }

    return res.status(200).json({ message: 'Question created', id: questionId });
  }
};

export const getByBlockId = async (req, res) => {
  const serverUserData = req.serverUserData;

  const result = zod.idSchema.safeParse(req.params.blockId);

  if (!result.success) {
    console.log(result.error.flatten());
    return res.status(400).json({ error: 'Bad data given' });
  }

  const blockId = result.data;

  try {
    let blockQuestions = await db
      .select()
      .from(questionModel)
      .where(eq(questionModel.blockId, blockId));

    try {
      blockQuestions = await Promise.all(
        blockQuestions.map(async question => {
          const answerVariables = await db
            .select()
            .from(answerVariant)
            .where(eq(answerVariant.questionId, question.id));

          return { ...question, answerVariables };
        })
      );
    } catch (err) {
      return res.status(500).json({ error: 'Failed to get question variables' });
    }

    return res.status(200).json({ blockQuestions });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to get questions' });
  }
};

export const getByQuestionId = async (req, res) => {
  const serverUserData = req.serverUserData;

  const result = zod.idSchema.safeParse(req.params.id);

  if (!result.success) {
    console.log(result.error.flatten());
    return res.status(400).json({ error: 'Bad data given' });
  }

  const questionId = result.data;

  try {
    let question = await db.select().from(questionModel).where(eq(questionModel.id, questionId));
    question = question[0];

    try {
      const answerVariables = await db.select().from(answerVariant).where(eq(answerVariant.questionId, question.id));

      question.answerVariables = answerVariables;
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: 'Failed to get question variables' });
    }

    return res.status(200).json(question);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get question' });
  }
};

export const deleteQuestion = async (req, res) => {
  const serverUserData = req.serverUserData;

  const result = zod.idSchema.safeParse(req.params.id);

  if (!result.success) {
    console.log(result.error.flatten());
    return res.status(400).json({ error: 'Bad data given' });
  }

  const questionId = result.data;

  try {
    const deleteQuestion = await db.delete(questionModel).where(eq(questionModel.id, questionId));
    if (deleteQuestion.affectedRows === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json({ message: 'Question deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete question' });
  }
};
